import { freshGame, restore, stats, itemLevel, forgeCost, forge, equip, equipStronger, sell, sellWeaker, step, replay, batchSize, BATCH_OPTIONS, browseResults, upgradeAnvil, finishUpgrade, anvilSkipCost, skipAnvilUpgrade, idleRewards, collectIdleRewards, IDLE_REWARD_INTERVAL, IDLE_REWARD_CAP, ANVILS, AVAILABLE_EPOCHS, FORGE_CHANCES, EPOCHS, WEAPONS, ARMOR_SETS, SLOTS, DAMAGE_SLOTS, LABELS, SAVE_KEY } from './game.mjs';
import { createScene } from './scene.mjs';

const $ = id => document.getElementById(id);
const localPreview=['localhost','127.0.0.1','[::1]'].includes(location.hostname)||/^(?:10\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}$/.test(location.hostname);
const requestedOutfit=new URLSearchParams(location.search).get('outfit');
const previewSet=localPreview&&[...ARMOR_SETS.flat(),'stone-guard'].includes(requestedOutfit)?requestedOutfit:null;
const requestedWeapon=new URLSearchParams(location.search).get('weapon');
const previewWeapon=localPreview&&Object.hasOwn(WEAPONS,requestedWeapon)?requestedWeapon:null;
let state;
let artVersion=Date.now();
window.addEventListener('storage',event=>{if(event.key==='forest-forge-art-update')artVersion=Date.now();});
let storageAvailable = true;
const telegramLaunch = Boolean(new URLSearchParams(location.hash.slice(1)).get('tgWebAppData') || window.Telegram?.WebApp?.initData);
let cloudInitData = '', cloudRevision = null, cloudReady = !telegramLaunch;
let cloudBusy = false, cloudDirty = false, cloudFailed = false, lastCloudSave = 0;
if (telegramLaunch) { state = freshGame(); $('cloud-status').hidden = false; $('game').inert = true; }
else try { state = restore(localStorage.getItem(SAVE_KEY)); } catch { state = freshGame(); storageAvailable = false; }
if(previewWeapon){state=freshGame();const w=WEAPONS[previewWeapon];state.equipment.weapon={slot:'weapon',weaponId:previewWeapon,name:w.name,quality:w.quality,epoch:w.epoch,itemLevel:1,value:Math.max(1,Math.round(2*w.multiplier)),sale:1};}
let ringTarget = null, bulkSaleSelection = null;
let sheetSlot = null, toastUntil = 0;
let savedTime = 0, uiTime = 0, frameCount = 0;
let running = false, raf = 0, last = 0, accumulated = 0;
let telegramInitialized = false, returnFocus = null;
const nodes = [...$('progress').children];
const equipmentButtons = [];
const compact = new Intl.NumberFormat('en', { notation:'compact', maximumFractionDigits:1 });
let anvilOpen = false;
let salePreview = null, saleUntil = 0;
let resultInFlight = false;
let displayedItemLevel = null;
let masteryView = 0; // Zero selects the epoch with the highest current forge chance.
try { const saved=Number(localStorage.getItem('forest-forge-mastery-view')); if(AVAILABLE_EPOCHS.includes(saved)) masteryView=saved; } catch {}
for (const epoch of [0,...AVAILABLE_EPOCHS]) {
  const button=document.createElement('button');button.textContent=epoch?EPOCHS[epoch-1]:'Auto';button.dataset.epoch=epoch;
  button.addEventListener('click',()=>{
    masteryView=epoch;try{localStorage.setItem('forest-forge-mastery-view',String(epoch));}catch{}
    $('mastery-options').hidden=true;$('mastery-choice').setAttribute('aria-expanded','false');updateUI();$('mastery-choice').focus({preventScroll:true});
  });
  $('mastery-options').append(button);
}
$('mastery-choice').addEventListener('click',()=>{
  const open=$('mastery-options').hidden;$('mastery-options').hidden=!open;$('mastery-choice').setAttribute('aria-expanded',String(open));
  if(open)$('mastery-options').querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
});
document.addEventListener('click',e=>{if(!e.target.closest('#mastery-info')){$('mastery-options').hidden=true;$('mastery-choice').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('mastery-options').hidden){$('mastery-options').hidden=true;$('mastery-choice').setAttribute('aria-expanded','false');$('mastery-choice').focus({preventScroll:true});}});

for (const [i, name] of EPOCHS.entries()) {
  const row = document.createElement('tr'); row.className = `epoch-${i + 1}`;
  row.innerHTML = `<th scope="row"><span class="epoch-name"><svg class="epoch-icon" viewBox="0 0 48 48" aria-hidden="true"><use href="assets/epoch-icons.svg#epoch-${i+1}"></use></svg><span>${name}</span></span></th><td id="chance-${i}"></td><td id="next-chance-${i}"></td>`;
  if (!AVAILABLE_EPOCHS.includes(i+1)) row.title = 'Equipment coming soon';
  $('probability-rows').append(row);

}
const save = (force = false) => {
  if(previewSet||previewWeapon)return;
  if (telegramLaunch) {
    if (!cloudReady) return;
    cloudDirty = true;
    if (!cloudFailed) void flushCloud(force);
    return;
  }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch { if (storageAvailable) notify('Saving is unavailable in this browser'); storageAvailable = false; }
};
function cloudError(status, loading = false) {
  if (status === 413 && !loading) {
    state.autoForge = false; cloudDirty = true;
    notify('Item stack is too large to save. Sell items from the stack.');
    return;
  }
  cloudFailed = true; running = false; cancelAnimationFrame(raf);
  $('game').inert = true; $('cloud-status').hidden = false; $('cloud-retry').hidden = false;
  $('cloud-message').textContent = status === 401 ? 'Session ended. Close and reopen the game in Telegram.' :
    status === 409 ? 'Another session saved newer progress. Load it to continue.' :
    loading ? 'Could not load your hero. Check your connection and try again.' : 'Saving paused. Check your connection and try again.';
  $('cloud-retry').textContent = status === 401 ? 'Close game' : status === 409 ? 'Load saved hero' : 'Retry';
  $('cloud-retry').onclick = () => {
    if (status === 401) { window.Telegram?.WebApp?.close(); return; }
    if (loading || status === 409) { void loadCloud(); return; }
    cloudFailed = false; void flushCloud(true);
  };
}
async function loadCloud() {
  cloudReady = false; cloudFailed = false;
  $('cloud-retry').hidden = true; $('cloud-message').textContent = 'Loading your hero…';
  try {
    if (!window.Telegram?.WebApp) await new Promise((resolve, reject) => {
      const script = document.querySelector('script[src*="telegram-web-app"]');
      const timeout = setTimeout(() => reject(Error('SDK unavailable')), 8000);
      script?.addEventListener('load', () => { clearTimeout(timeout); resolve(); }, { once:true });
      script?.addEventListener('error', () => { clearTimeout(timeout); reject(Error('SDK unavailable')); }, { once:true });
    });
    setupTelegram(); cloudInitData = window.Telegram?.WebApp?.initData || '';
    if (!cloudInitData) { cloudError(401, true); return; }
    const response = await fetch('/api/save', { headers: { 'x-telegram-init-data':cloudInitData }, cache:'no-store', signal:AbortSignal.timeout(10000) });
    if (!response.ok) { cloudError(response.status, true); return; }
    const result = await response.json();
    if (!result.state || result.state.version !== 3 || !Number.isSafeInteger(result.revision)) throw Error('Invalid cloud save');
    state = restore(JSON.stringify(result.state)); cloudRevision = result.revision;
    cloudReady = true; cloudDirty = false; lastCloudSave = performance.now();
    $('cloud-status').hidden = true; $('game').inert = false; updateUI(); start();
  } catch { cloudError(0, true); }
}
async function flushCloud(force = false) {
  if (!cloudReady || cloudBusy || !cloudDirty || (!force && performance.now() - lastCloudSave < 10000)) return;
  cloudBusy = true; cloudDirty = false; lastCloudSave = performance.now();
  let saved = false;
  const body = JSON.stringify({ state, revision:cloudRevision });
  try {
    const response = await fetch('/api/save', { method:'PUT', headers:{'Content-Type':'application/json','x-telegram-init-data':cloudInitData}, body, keepalive:new TextEncoder().encode(body).length < 60000, signal:AbortSignal.timeout(10000) });
    if (!response.ok) { cloudDirty = true; cloudError(response.status); return; }
    const result = await response.json();
    if (!Number.isSafeInteger(result.revision)) throw Error('Invalid save response');
    cloudRevision = result.revision; cloudFailed = false;
    saved = true;
    $('cloud-status').hidden = true; $('game').inert = false; start();
  } catch { cloudDirty = true; cloudError(0); }
  finally {
    cloudBusy = false;
    if (saved && document.hidden && cloudDirty && !cloudFailed) void flushCloud(true);
  }
}
function notify(text) { $('toast').textContent = text; $('toast').classList.add('visible'); toastUntil = performance.now() + 2200; }
function setText(id, value) { const text = String(value); if ($(id).textContent !== text) $(id).textContent = text; }
function itemArt(img, item) { if(item.slot==='weapon'&&WEAPONS[item.weaponId]?.sprite&&WEAPONS[item.weaponId].epoch===(item.epoch??1)){const path=`assets/weapons/${item.weaponId}-icon.png?v=${artVersion}`;if(img.getAttribute('src')!==path)img.src=path;return;}const set=item.slot==='weapon'?((item.epoch??1)===1?['hunter-hides','bone-warrior','stone-guard'][item.quality]:undefined):ARMOR_SETS[(item.epoch??1)-1]?.[item.quality];const path = set && ['weapon','helmet','chest','shoulders','cape','gloves','legs','boots'].includes(item.slot) ? `assets/sets/${set}/${item.slot}-icon.png?v=${artVersion}` : `assets/${item.slot === 'ring' ? 'ring1' : item.slot}${(item.epoch??1)>ARMOR_SETS.length?'':'-'+item.quality}.svg`; if (img.getAttribute('src') !== path) img.src = path; }
function describe(item) { return `${DAMAGE_SLOTS.includes(item.slot) ? 'Damage' : 'Health'} ${compact.format(item.value)}`; }

for (const slot of SLOTS) {
  const button = document.createElement('button');
  button.className = 'slot'; button.dataset.slot = slot;
  const img = document.createElement('img'); img.src = `assets/${slot}.svg`; img.alt = '';
  button.append(img);
  const level = document.createElement('span'); level.className = 'item-level'; button.append(level);
  button.addEventListener('click', () => openSheet(slot));
  $('equipment').append(button); equipmentButtons.push(button);
}

function fillSheet() {
  const candidate = sheetSlot === 'pending' ? state.pending : null;
  const ringChoice = candidate?.slot === 'ring';
  const old = state.equipment[ringChoice ? ringTarget : candidate ? candidate.slot : sheetSlot];
  $('ring-targets').hidden = !ringChoice;
  if (ringChoice) for (const slot of ['ring1','ring2']) {
    const item = state.equipment[slot], button = $(`choose-${slot}`);
    button.setAttribute('aria-pressed', String(ringTarget === slot));
    button.setAttribute('aria-label', `${LABELS[slot]}: ${item ? `${item.name}, ${describe(item)}` : 'Empty'}`);
    $(`${slot}-card`).className = `item-icon epoch-${item?.epoch ?? 1}${item ? '' : ' empty'}`;
    if (item) itemArt($(`${slot}-image`), item);
    else $(`${slot}-image`).src = `assets/${slot}.svg`;
  }
  $('equip').setAttribute('aria-label', ringChoice ? `Equip in ${LABELS[ringTarget]}` : 'Equip item');
  $('equipped-card').className = `item-icon epoch-${old?.epoch ?? 1}${old ? '' : ' empty'}`;
  if (old) itemArt($('equipped-image'), old);
  else $('equipped-image').src = `assets/${ringChoice ? ringTarget : candidate?.slot ?? sheetSlot}.svg`;
  setText('equipped-name', old ? old.name : 'Nothing equipped');
  setText('equipped-epoch', old ? EPOCHS[(old.epoch ?? 1) - 1] : 'Empty slot');
  setText('equipped-level', old ? `lv.${old.itemLevel ?? 1}` : '');
  setText('equipped-stat', old ? describe(old) : `${DAMAGE_SLOTS.includes(candidate?.slot ?? sheetSlot) ? 'Damage' : 'Health'} 0`);
  $('result-nav').hidden = !candidate;
  $('equip-stronger').disabled = !candidate || !equipStronger(state, true);
  setText('results-remaining', `${compact.format(state.results.length + (state.pending ? 1 : 0))} items ready`);
  $('previous-result').disabled = $('next-result').disabled = !state.results.length;
  $('new-row').hidden = !candidate; $('sheet-actions').hidden = !candidate;
  const weaker = candidate ? sellWeaker(state, true, bulkSaleSelection) : { count:0 };
  $('sell-weaker').hidden = !weaker.count;
  $('sell-weaker').setAttribute('aria-label', `Sell ${weaker.count} weaker or equal items`);
  if (bulkSaleSelection) setText('bulk-sale-summary', `Sell ${weaker.count} weaker or equal items for ${weaker.coins.toLocaleString('en')} coins?`);
  for (const id of ['sell', 'equip', 'choose-ring1', 'choose-ring2']) $(id).disabled = !!bulkSaleSelection;
  if (candidate) {
    $('new-card').className = `item-icon epoch-${candidate.epoch ?? 1}`;
    itemArt($('new-image'), candidate);
    setText('new-name', candidate.name); setText('new-stat', describe(candidate));
    setText('new-epoch', EPOCHS[(candidate.epoch ?? 1) - 1]);
    setText('new-level', `lv.${candidate.itemLevel ?? 1}`);
    const diff = candidate.value - (old?.value ?? 0);
    setText('difference', diff > 0 ? `+${compact.format(diff)}` : diff < 0 ? `−${compact.format(Math.abs(diff))}` : '= 0');
    $('difference').className = diff > 0 ? 'better' : diff < 0 ? 'worse' : 'equal';
    setText('sell-price', candidate.sale);
  }
}
function openSheet(slot) {
  $('batch-options').hidden = true; $('batch-choice').setAttribute('aria-expanded', 'false');
  if (slot === 'pending' && !state.pending) return;
  returnFocus = document.activeElement;
  ringTarget = slot === 'pending' && state.pending?.slot === 'ring' ? (!state.equipment.ring1 ? 'ring1' : !state.equipment.ring2 ? 'ring2' : 'ring1') : null;
  sheetSlot = slot; fillSheet();
  $('comparison').hidden = false; $('sheet-backdrop').hidden = false;
  $('equipment').inert = true; document.querySelector('.forge-area').inert = true;
  $('close-sheet').focus({ preventScroll: true });
  if (telegramInitialized) window.Telegram.WebApp.BackButton?.show();
}
function closeSheet() {
  if ($('auto-dialog').open) { $('auto-dialog').close(); return; }
  if ($('idle-dialog').open) { $('idle-dialog').close(); return; }
  if ($('bulk-sale-confirm').open) { $('cancel-bulk-sale').click(); return; }
  bulkSaleSelection = null;
  anvilOpen = false; $('anvil-dialog').hidden = true;
  sheetSlot = null; $('comparison').hidden = true; $('sheet-backdrop').hidden = true;
  $('equipment').inert = false; document.querySelector('.forge-area').inert = false;
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  if (telegramInitialized) window.Telegram.WebApp.BackButton?.hide();
}

function updateIdleRewards() {
  const now = Date.now(), amount = idleRewards(state, now), full = amount === IDLE_REWARD_CAP;
  $('idle-loot').classList.toggle('full', full);
  $('idle-loot').setAttribute('aria-label', `Idle rewards: ${amount} hammers and ${amount} coins${full ? ', storage full' : ''}`);
  if (!$('idle-dialog').open) return;
  const elapsed = Math.min(IDLE_REWARD_CAP * IDLE_REWARD_INTERVAL, Math.max(0, now - state.idleSince));
  const minutes = Math.floor(elapsed / IDLE_REWARD_INTERVAL);
  setText('idle-hammers', amount); setText('idle-coins', amount);
  setText('idle-time', `${minutes >= 60 ? Math.floor(minutes / 60) + 'h ' : ''}${minutes % 60}m / 4h`);
  setText('idle-next', full ? 'Storage full' : `+1 in ${Math.ceil((IDLE_REWARD_INTERVAL - elapsed % IDLE_REWARD_INTERVAL) / 1000)}s`);
  $('idle-progress').value = elapsed / IDLE_REWARD_INTERVAL;
  $('idle-progress').setAttribute('aria-valuetext', `${amount} of ${IDLE_REWARD_CAP} hammers and coins`);
  $('collect-idle').disabled = !amount;
}
$('idle-loot').addEventListener('click', () => {
  if (sheetSlot || anvilOpen) closeSheet();
  $('batch-options').hidden = true; $('batch-choice').setAttribute('aria-expanded', 'false');
  $('mastery-options').hidden = true; $('mastery-choice').setAttribute('aria-expanded', 'false');
  $('idle-dialog').showModal(); updateIdleRewards();
  if (telegramInitialized) window.Telegram.WebApp.BackButton?.show();
});
$('close-idle').addEventListener('click', () => $('idle-dialog').close());
$('collect-idle').addEventListener('click', () => {
  const amount = collectIdleRewards(state);
  if (!amount) return;
  save(); updateUI(); $('idle-dialog').close();
  const layer = $('reward-flight'); layer.replaceChildren();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bounds = layer.getBoundingClientRect(), centerX = bounds.width / 2, centerY = bounds.height / 2, count = Math.min(3, amount);
  const targets = [
    ['hammer', document.querySelector('.hammer-balance > .hammer-icon').getBoundingClientRect(), 32],
    ['coin', document.querySelector('.money > .coin').getBoundingClientRect(), 24]
  ];
  for (const [kind, target, size] of targets) {
    const hammer = kind === 'hammer', endX = target.x + target.width / 2 - bounds.x, endY = target.y + target.height / 2 - bounds.y;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement(hammer ? 'img' : 'i');
      particle.className = `reward-particle reward-${kind}${hammer ? '' : ' coin'}`;
      if (hammer) { particle.src = 'assets/hammer.webp'; particle.alt = ''; }
      const spread = i - (count - 1) / 2;
      const x = centerX + (hammer ? -24 : 24) + spread * 12, y = centerY + spread * 9;
      const bendX = hammer ? centerX - 65 : Math.min(bounds.width - 24, endX + 35), bendY = hammer ? (y + endY) / 2 : y - 65;
      const angle = hammer ? -16 + i * 9 : 0;
      const keys = [
        { offset:0, transform:`translate(${centerX-size/2}px,${centerY-size/2}px) scale(.2) rotate(${angle}deg)`, opacity:0 },
        { offset:.16, transform:`translate(${x-size/2}px,${y-size/2}px) scale(1.08) rotate(${angle}deg)`, opacity:1 },
        { offset:.24, transform:`translate(${x-size/2}px,${y-size/2}px) scale(1) rotate(${angle}deg)`, opacity:1 }
      ];
      for (let frame = 1; frame <= 8; frame++) {
        const progress = frame / 8, t = progress * progress, u = 1 - t;
        const px = u*u*x + 2*u*t*bendX + t*t*endX, py = u*u*y + 2*u*t*bendY + t*t*endY;
        keys.push({ offset:.24 + .76*progress, transform:`translate(${px-size/2}px,${py-size/2}px) scale(${1+(target.width/size-1)*t}) rotate(${angle*u}deg)`, opacity:1 });
      }
      layer.append(particle);
      particle.animate(keys, {duration:850, delay:i*55, fill:'both'}).onfinish = () => particle.remove();
    }
  }
});
$('idle-dialog').addEventListener('close', () => {
  if (telegramInitialized && !sheetSlot && !anvilOpen) window.Telegram.WebApp.BackButton?.hide();
});
$('idle-dialog').addEventListener('click', event => {
  const box = $('idle-dialog').getBoundingClientRect();
  if (event.target === $('idle-dialog') && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) $('idle-dialog').close();
});

$('forge').addEventListener('click', () => {
  if (!state.hammers) { notify('Defeat goblins to find hammers.'); return; }
  if (forge(state)) { save(); updateUI(); }
});
for (const option of BATCH_OPTIONS) {
  const button = document.createElement('button');
  button.addEventListener('click', () => {
    state.selectedBatch = option.size;
    $('batch-options').hidden = true; $('batch-choice').setAttribute('aria-expanded', 'false');
    save(); updateUI(); $('batch-choice').focus({preventScroll:true});
  });
  $('batch-options').append(button);
}
$('batch-choice').addEventListener('click', () => {
  const open = $('batch-options').hidden;
  $('batch-options').hidden = !open; $('batch-choice').setAttribute('aria-expanded', String(open));
  if (open) $('batch-options').querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
});
document.addEventListener('click', e => {
  if (!e.target.closest('.forge-center')) {
    $('batch-options').hidden = true; $('batch-choice').setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('batch-options').hidden) {
    $('batch-options').hidden = true; $('batch-choice').setAttribute('aria-expanded', 'false'); $('batch-choice').focus({preventScroll:true});
  }
});
$('results').addEventListener('click', () => openSheet('pending'));
for (const epoch of AVAILABLE_EPOCHS) {
  const row = document.createElement('label'); row.className = `auto-epoch epoch-${epoch}`; row.dataset.epoch = epoch;
  row.innerHTML = `<input type="checkbox" aria-label="Keep ${EPOCHS[epoch-1]} items"><svg class="epoch-icon" viewBox="0 0 48 48" aria-hidden="true"><use href="assets/epoch-icons.svg#epoch-${epoch}"></use></svg><span>${EPOCHS[epoch-1]}</span><small></small>`;
  row.querySelector('input').addEventListener('change', event => {
    state.autoSellEpochs = state.autoSellEpochs.filter(value => value !== epoch);
    if (!event.target.checked) state.autoSellEpochs.push(epoch);
    save(); updateAutoFilter();
  });
  $('auto-epochs').append(row);
}
function updateAutoFilter() {
  for (const row of $('auto-epochs').children) {
    const epoch = Number(row.dataset.epoch), chance = FORGE_CHANCES[state.anvilLevel-1][epoch-1];
    row.hidden = chance <= 0;
    row.querySelector('input').checked = !state.autoSellEpochs.includes(epoch);
    row.querySelector('small').textContent = Number(chance.toFixed(2)) + '%';
  }
  setText('run-auto', state.autoForge ? 'Stop' : state.hammers ? 'Start' : 'No hammers');
  $('run-auto').className = `button ${state.autoForge ? 'red' : 'blue'}`;
  $('run-auto').disabled = !state.autoForge && !state.hammers;
}
$('auto-forge').addEventListener('click', () => {
  if (sheetSlot || anvilOpen) closeSheet();
  $('batch-options').hidden = true; $('batch-choice').setAttribute('aria-expanded', 'false');
  $('mastery-options').hidden = true; $('mastery-choice').setAttribute('aria-expanded', 'false');
  updateAutoFilter(); $('auto-dialog').showModal();
  if (telegramInitialized) window.Telegram.WebApp.BackButton?.show();
});
$('run-auto').addEventListener('click', () => {
  if (!state.autoForge && !state.hammers) return;
  state.autoForge = !state.autoForge; save(); updateUI(); $('auto-dialog').close();
});
$('close-auto').addEventListener('click', () => $('auto-dialog').close());
$('auto-dialog').addEventListener('close', () => {
  if (telegramInitialized && !sheetSlot && !anvilOpen) window.Telegram.WebApp.BackButton?.hide();
});
$('auto-dialog').addEventListener('click', event => {
  const box = $('auto-dialog').getBoundingClientRect();
  if (event.target === $('auto-dialog') && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) $('auto-dialog').close();
});
for (const [id, direction] of [['previous-result',-1], ['next-result',1]]) $(id).addEventListener('click', () => {
  browseResults(state, direction); chooseDefaultRing(); fillSheet(); save();
});
function chooseDefaultRing() { ringTarget = state.pending?.slot === 'ring' ? (!state.equipment.ring1 ? 'ring1' : !state.equipment.ring2 ? 'ring2' : 'ring1') : null; }
function afterItemAction(text, keepSelection = false) {
  if (state.pending) { if (!keepSelection) chooseDefaultRing(); fillSheet(); } else closeSheet();
  save(); updateUI(); if (text) notify(text);
}
function openAnvil() {
  $('batch-options').hidden = true; $('batch-choice').setAttribute('aria-expanded', 'false');
  returnFocus = document.activeElement; anvilOpen = true;
  $('anvil-dialog').hidden = false; $('sheet-backdrop').hidden = false;
  $('equipment').inert = true; document.querySelector('.forge-area').inert = true;
  updateAnvil(); $('close-anvil').focus({preventScroll:true});
  if (telegramInitialized) window.Telegram.WebApp.BackButton?.show();
}
$('anvil-info').addEventListener('click', () => openAnvil());
$('close-anvil').addEventListener('click', closeSheet);
$('upgrade-anvil').addEventListener('click', () => { if (upgradeAnvil(state)) { save(); updateUI(); } });
$('skip-anvil-coins').addEventListener('click', () => { if (skipAnvilUpgrade(state)) { save(); updateUI(); } });
$('skip-anvil-time').addEventListener('click',()=>{if(localPreview&&finishUpgrade(state,state.upgradeEndsAt)){save();updateUI();notify(`Anvil reached level ${state.anvilLevel}`);}});
function timeLeft() {
  const seconds = Math.max(0, Math.ceil((state.upgradeEndsAt - Date.now()) / 1000));
  return seconds >= 86400 ? `${Math.floor(seconds / 86400)}d ${Math.floor(seconds % 86400 / 3600)}h`
    : seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
function updateAnvil() {
  const next = ANVILS[state.anvilLevel], now = Date.now(), upgrading = !!state.upgradeEndsAt;
  const remaining = Math.max(0, state.upgradeEndsAt - now), duration = (next?.minutes ?? 0) * 60000;
  const skipCost = anvilSkipCost(state, now);
  setText('anvil-coins', state.coins.toLocaleString('en'));
  $('upgrade-progress-wrap').hidden = !upgrading;
  $('upgrade-progress').value = duration ? Math.max(0, Math.min(100, 100 * (1 - remaining / duration))) : 0;
  setText('upgrade-time', timeLeft());
  $('upgrade-anvil').hidden = upgrading;
  $('skip-anvil-coins').hidden = !upgrading;
  $('skip-anvil-coins').disabled = !skipCost || state.coins < skipCost;
  $('skip-anvil-coins').setAttribute('aria-label', `Skip upgrade for ${skipCost.toLocaleString('en')} coins`);
  setText('skip-anvil-price', skipCost.toLocaleString('en'));
  const durationLabel = next ? (next.minutes < 60 ? `${next.minutes} min` : `${(next.minutes / 60).toFixed(1)} h`) : '';
  setText('anvil-level', next ? `Anvil · Lv. ${state.anvilLevel} → ${state.anvilLevel + 1}${upgrading ? '' : ` · ${durationLabel}`}` : `Anvil · Lv. ${state.anvilLevel} · Max`);
  setText('upgrade-anvil', state.upgradeEndsAt ? 'Upgrade in progress' : next ? `Upgrade · ${next.coins.toLocaleString('en')} coins` : 'Max level');
  $('upgrade-anvil').disabled = !!state.upgradeEndsAt || !next || state.coins < next.coins;
  $('skip-anvil-time').hidden=!localPreview||!state.upgradeEndsAt;
  $('new-game').hidden = !localPreview;
  setText('current-anvil-level', `Lv. ${state.anvilLevel}`); setText('next-anvil-level', next ? `Lv. ${state.anvilLevel + 1}` : 'Max');
  EPOCHS.forEach((name,i) => {
    setText('chance-' + i, Number(FORGE_CHANCES[state.anvilLevel - 1][i].toFixed(2)) + '%');
    setText('next-chance-' + i, next ? Number(FORGE_CHANCES[state.anvilLevel][i].toFixed(2)) + '%' : '—');

  });
}
for (const slot of ['ring1','ring2']) $(`choose-${slot}`).addEventListener('click', () => { ringTarget = slot; fillSheet(); });
$('close-sheet').addEventListener('click', closeSheet);
$('sheet-backdrop').addEventListener('click', closeSheet);
$('sell').addEventListener('click', () => { if (sell(state)) { afterItemAction(); } });
$('sell-weaker').addEventListener('click', () => {
  if (!sellWeaker(state, true).count) return;
  // The confirmation covers these ready cards; batches finishing later stay in the stack.
  bulkSaleSelection = new Set([state.pending, ...state.results]);
  fillSheet(); $('bulk-sale-confirm').showModal(); $('cancel-bulk-sale').focus({ preventScroll:true });
});
$('cancel-bulk-sale').addEventListener('click', () => {
  $('bulk-sale-confirm').close();
  bulkSaleSelection = null; fillSheet(); $('sell-weaker').focus({ preventScroll:true });
});
$('confirm-bulk-sale').addEventListener('click', () => {
  if (!bulkSaleSelection) return;
  const selected = state.pending;
  sellWeaker(state, false, bulkSaleSelection);
  $('bulk-sale-confirm').close(); bulkSaleSelection = null;
  afterItemAction(null, selected === state.pending);
  if (sheetSlot) $('close-sheet').focus({ preventScroll:true });
});
$('bulk-sale-confirm').addEventListener('cancel', event => {
  event.preventDefault(); $('cancel-bulk-sale').click();
});
$('bulk-sale-confirm').addEventListener('click', event => {
  const box = $('bulk-sale-confirm').getBoundingClientRect();
  if (event.target === $('bulk-sale-confirm') && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) $('cancel-bulk-sale').click();
});
$('equip-stronger').addEventListener('click', () => {
  const selected = state.pending;
  if (equipStronger(state)) afterItemAction(null, selected === state.pending);
});
$('equip').addEventListener('click', () => { if (equip(state, state.pending?.slot === 'ring' ? ringTarget : state.pending?.slot)) { afterItemAction(null); } });
$('replay').addEventListener('click', () => { if (replay(state)) { save(); updateUI(); } });
$('new-game').addEventListener('click', () => {
  if (confirm('Start a new hero? Your current equipment, coins, hammers, and progress will be reset.')) {
    closeSheet(); state = freshGame(); save(); updateUI();
  }
});
document.addEventListener('keydown', e => {
  if ($('bulk-sale-confirm').open || $('idle-dialog').open || $('auto-dialog').open || (!sheetSlot && !anvilOpen)) return;
  if (e.key === 'Escape') closeSheet();
  if (e.key === 'Tab') {
    const dialog = anvilOpen ? $('anvil-dialog') : $('comparison');
    const buttons = [...dialog.querySelectorAll('button')].filter(b => !b.disabled && b.getClientRects().length);
    const at = buttons.indexOf(document.activeElement);
    e.preventDefault(); buttons[(at + (e.shiftKey ? buttons.length - 1 : 1)) % buttons.length].focus();
  }
});

function updateUI() {
  updateIdleRewards();
  const total = stats(state);
  const level = itemLevel(state);
  setText('item-level', level);
  $('item-level-hud').setAttribute('aria-label', `Item Level ${level}`);
  if (displayedItemLevel !== null && displayedItemLevel !== level) {
    const difference = level - displayedItemLevel, change = $('item-level-change');
    change.getAnimations().forEach(animation => animation.cancel());
    setText('item-level-sign', difference > 0 ? '+' : '−');
    setText('item-level-amount', compact.format(Math.abs(difference)));
    change.className = difference > 0 ? 'increased' : 'decreased';
    change.hidden = false;
    const rise = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : -7;
    change.animate([
      { transform:'translate(-50%,-50%)', opacity:1 },
      { transform:`translate(-50%,calc(-50% + ${rise * .5}px))`, opacity:1, offset:.45 },
      { transform:`translate(-50%,calc(-50% + ${rise}px))`, opacity:0 }
    ], { duration:2000, easing:'ease-out' }).onfinish = () => { change.hidden = true; };
  }
  displayedItemLevel = level;
  setText('coins', compact.format(state.coins)); setText('damage', compact.format(total.damage)); setText('max-hp', compact.format(total.hp));
  setText('level', `Level 1–${state.level}`);
  setText('wave-label', `Wave ${state.encounter + 1} / 10`);
  nodes.forEach((n, i) => { n.classList.toggle('passed', state.completed || i < state.encounter); n.classList.toggle('active', !state.completed && i === state.encounter); });
  $('progress').setAttribute('aria-label', `Wave ${state.encounter + 1} of 10, level ${state.level}`);
  equipmentButtons.forEach((b, i) => {
    const item = state.equipment[SLOTS[i]];
    const cls = item ? `slot epoch-${item.epoch ?? 1}` : 'slot vacant';
    b.firstElementChild.style.opacity = item ? '1' : '.25';
    if (b.className !== cls) b.className = cls;
    if (item) itemArt(b.firstElementChild, item);
    b.querySelector('.item-level').textContent = item?.itemLevel ? `lv.${item.itemLevel}` : '';
    b.setAttribute('aria-label', item ? `${LABELS[item.slot]}: ${item.name}, ${describe(item)}` : `${LABELS[SLOTS[i]]}: Empty`);
  });
  const forging = state.forging > 0;
  $('forge').disabled = forging;
  $('forge').classList.toggle('forging', forging);
  $('forge').style.setProperty('--forge-time', `${-(1.5 - state.forging)}s`);
  $('forge').classList.toggle('poor', !state.hammers);
  $('forge').classList.toggle('first-forge', state.hammers > 0 && state.mastery.every(m => m.level === 1 && m.xp === 0));
  $('forge').setAttribute('aria-label', `Forge ${forgeCost(state)} items for ${forgeCost(state)} hammers`);
  setText('hammers', state.hammers.toLocaleString('en').replaceAll(',', ' '));
  setText('batch-label', `×${state.selectedBatch ?? batchSize(state)}`);
  $('batch-choice').setAttribute('aria-label', `Choose batch size, currently ${state.selectedBatch ?? batchSize(state)}`);
  for (const [i, option] of BATCH_OPTIONS.entries()) {
    const button = $('batch-options').children[i], unlocked = state.highest >= option.level;
    button.disabled = !unlocked;
    button.textContent = unlocked ? `×${option.size}` : `×${option.size} · Level 1–${option.level} 🔒`;
    button.setAttribute('aria-pressed', String(option.size === (state.selectedBatch ?? batchSize(state))));
  }
  // Keep the displayed stack until the one incoming batch card lands.
  if (!resultInFlight) {
    if (salePreview && performance.now() >= saleUntil) salePreview = null;
    const preview = state.pending ?? salePreview;
    $('results').hidden = !preview; $('results').disabled = !state.pending;
    $('results').style.visibility = '';
    if (preview) itemArt($('result-image'), preview);
    setText('result-level', preview?.itemLevel ? `lv.${preview.itemLevel}` : '');
    for (const [selector, item] of [['.stack-front',preview],['.stack-back-one',state.results[0] ?? salePreview],['.stack-back-two',state.results[1] ?? salePreview]]) {
      const card = document.querySelector(selector);
      card.className = `stack-card ${selector.slice(1)} epoch-${item?.epoch ?? 1}`;
    }
    setText('result-count', compact.format(state.results.length + (state.pending ? 1 : 0)));
    $('result-count').hidden = !state.pending;
  }
  setText('auto-forge', state.autoForge ? 'Auto ON' : 'Auto OFF');
  $('auto-forge').setAttribute('aria-pressed', String(state.autoForge));
  setText('anvil-info', state.upgradeEndsAt ? `Lv. ${state.anvilLevel} · ${timeLeft()}` : `Anvil Lv. ${state.anvilLevel}`);
  const chances=FORGE_CHANCES[state.anvilLevel-1];
  const shownEpoch=masteryView||AVAILABLE_EPOCHS.reduce((best,epoch)=>chances[epoch-1]>chances[best-1]?epoch:best,AVAILABLE_EPOCHS[0]);
  const mastery = state.mastery[shownEpoch - 1];
  setText('mastery-label', EPOCHS[shownEpoch - 1]);
  setText('mastery-level', `Max Lv. ${mastery.level}`);
  setText('mastery-xp', mastery.level === 100 ? 'MAX' : `${mastery.xp} / ${mastery.level + 4} XP`);
  $('mastery-progress').style.setProperty('--fill', `${mastery.level === 100 ? 100 : mastery.xp / (mastery.level + 4) * 100}%`);
  $('mastery-choice').setAttribute('aria-label', `${masteryView?'':'Auto: '}${EPOCHS[shownEpoch-1]} mastery, ${$('mastery-xp').textContent}, maximum item level ${mastery.level}. Choose displayed epoch`);
  for(const button of $('mastery-options').children)button.setAttribute('aria-pressed',String(Number(button.dataset.epoch)===masteryView));
  $('forge-hint').hidden = storageAvailable;
  setText('forge-hint', 'Progress is not being saved: storage unavailable');
  if (anvilOpen) updateAnvil();
  if ($('auto-dialog').open) updateAutoFilter();
  if (sheetSlot === 'pending') fillSheet();
  $('completed').hidden = !state.completed;
}

let scene;
function processEvents(events) {
  for (const event of events) {
    scene?.emit(event);
    if (event.type === 'forged') {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const keptCount = event.count - event.soldCount;
      const item = keptCount ? state.results.at(-keptCount) ?? state.pending : event.item;
      resultInFlight = !!item && !reduced;
      updateUI();
      if (resultInFlight) {
        const card = $('forge-result'), stack = $('results'), hadStack = !stack.hidden;
        card.getAnimations().forEach(animation => animation.cancel());
        // Reserve the empty stack's position without revealing it before arrival.
        if (!hadStack) { stack.hidden = false; stack.style.visibility = 'hidden'; }
        itemArt(card.firstElementChild, item); card.className = `item-icon epoch-${item.epoch ?? 1}`;
        const workshop = $('workshop').getBoundingClientRect(), from = $('forge-image').getBoundingClientRect(), to = document.querySelector('.stack-front').getBoundingClientRect();
        card.style.left = `${from.x + from.width / 2 - 24 - workshop.x}px`;
        card.style.top = `${from.y + 6 - workshop.y}px`;
        const dx = to.x + (hadStack ? 17 : 0) - (from.x + from.width / 2 - 24), dy = to.y + (hadStack ? 3 : 0) - (from.y + 6);
        card.hidden = false;
        card.animate([
          { transform:'translate(0,0) scale(.65) rotate(-8deg)', opacity:0 },
          { transform:`translate(${dx * .45}px,${Math.min(0, dy) - 25}px) scale(1) rotate(3deg)`, opacity:1, offset:.45 },
          { transform:`translate(${dx}px,${dy}px) scale(1) rotate(${hadStack ? 9 : 0}deg)`, opacity:1 }
        ], { duration:340, easing:'ease-out', fill:'forwards' }).onfinish = () => {
          resultInFlight = false;
          if (event.soldCount) { salePreview = item; saleUntil = performance.now() + 850; }
          updateUI(); card.hidden = true;
          stack.getAnimations().forEach(animation => animation.cancel());
          stack.animate([
            { transform:'translateY(0) rotate(0deg)' },
            { transform:'translateY(3px) rotate(1.5deg)', offset:.35 },
            { transform:'translateY(0) rotate(0deg)' }
          ], { duration:120, easing:'ease-out' });
          if (event.soldCount) {
            $('forge-coins').replaceChildren();
            const count = Math.min(6, event.soldCount + 3);
            for (let i = 0; i < count; i++) {
              const coin = document.createElement('i'); coin.className = 'coin forge-coin';
              coin.style.left = `${to.x + to.width / 2 - workshop.x - 4}px`;
              coin.style.top = `${to.y + to.height * .45 - workshop.y - 4}px`;
              $('forge-coins').append(coin);
              const vx = (i / (count - 1) - .5) * 96, vy = -64 - Math.random() * 16;
              const keys = Array.from({length:9}, (_,frame) => {
                const t = frame / 8;
                return { offset:t, transform:`translate(${vx*t}px,${vy*t+90*t*t}px) rotateY(${t*540}deg)`, opacity:Math.min(1,(1-t)/.25) };
              });
              coin.animate(keys, {duration:700, delay:i*12, fill:'both'}).onfinish = () => coin.remove();
            }
          }
        };
      }
    }
    if (event.type === 'anvilUpgraded') notify(`Anvil reached level ${state.anvilLevel}`);
    if (['kill', 'death', 'level', 'complete', 'forged', 'forgeStarted', 'anvilUpgraded'].includes(event.type)) save();
  }
}
function frame(now) {
  if (!running) return;
  const dt = Math.min((now - last) / 1000, .25);
  last = now; accumulated += dt;
  if (accumulated >= 1 / 30) {
    const elapsed = accumulated;
    while (accumulated >= 1 / 30) { processEvents(step(state, 1 / 30)); accumulated -= 1 / 30; }
    if (state.forging > 0) $('forge').style.setProperty('--forge-time', `${-(1.5 - state.forging)}s`);
    scene?.render(state, elapsed); frameCount++;
    uiTime += elapsed; savedTime += elapsed;
    if (uiTime >= .1) { updateUI(); uiTime = 0; }
    if (savedTime >= 3) { save(); savedTime = 0; }
    if (toastUntil && now > toastUntil) { $('toast').classList.remove('visible'); toastUntil = 0; }
  }
  raf = requestAnimationFrame(frame);
}
function start() { if (running || document.hidden || !scene || !cloudReady || cloudFailed) return; if (finishUpgrade(state)) save(); updateUI(); running = true; last = performance.now(); accumulated = 0; raf = requestAnimationFrame(frame); }
function stop() { running = false; cancelAnimationFrame(raf); save(true); }
document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', start);

function setupTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg || telegramInitialized) return;
  telegramInitialized = true;
  tg.ready(); tg.expand();
  if (tg.isVersionAtLeast?.('6.1')) { tg.setHeaderColor(tg.isVersionAtLeast('6.9') ? '#72c851' : 'bg_color'); tg.setBackgroundColor('#fffaf0'); }
  if (tg.isVersionAtLeast?.('7.7')) tg.disableVerticalSwipes();
  function safeArea() {
    // Telegram's content inset starts inside the device safe area (status bar/notch).
    for (const edge of ['top', 'bottom']) {
      document.documentElement.style.setProperty(`--safe-${edge}`, `calc(max(env(safe-area-inset-${edge}, 0px), ${tg.safeAreaInset?.[edge] || 0}px) + ${tg.contentSafeAreaInset?.[edge] || 0}px)`);
    }
    document.documentElement.classList.toggle('telegram-app', Boolean(tg.initData));
    document.documentElement.classList.toggle('telegram-fullscreen', Boolean(tg.initData && tg.isFullscreen));
  }
  safeArea();
  tg.onEvent('safeAreaChanged', safeArea); tg.onEvent('contentSafeAreaChanged', safeArea);
  tg.onEvent('fullscreenChanged', safeArea); tg.onEvent('fullscreenFailed', safeArea);
  if (tg.initData && tg.isVersionAtLeast?.('8.0') && !tg.isFullscreen) {
    try { tg.requestFullscreen(); } catch { /* Keep the expanded view if this client cannot enter fullscreen. */ }
  }
  tg.onEvent('activated', start); tg.onEvent('deactivated', stop);
  tg.BackButton?.onClick(closeSheet);
  if (sheetSlot || anvilOpen || $('idle-dialog').open || $('auto-dialog').open) tg.BackButton?.show();
}
// The external Telegram SDK is optional; normal browser startup never waits for it.
document.querySelector('script[src*="telegram-web-app"]')?.addEventListener('load', setupTelegram);
setupTelegram(); updateUI(); save();
if(previewWeapon){
 $('outfit-preview').hidden=false;$('outfit-name').textContent='Weapon test';$('outfit-preview').querySelector('small').textContent='Progress is not saved';$('outfit-edit').hidden=true;$('weapon-choice').hidden=false;
 for(const [id,w] of Object.entries(WEAPONS)){const option=document.createElement('option');option.value=id;option.textContent=w.name;$('weapon-choice').append(option);}$('weapon-choice').value=previewWeapon;$('weapon-choice').onchange=()=>location.href='/?weapon='+$('weapon-choice').value;
 $('workshop').inert=true;$('replay').disabled=true;
}
if(previewSet){$('outfit-preview').hidden=false;$('outfit-edit').href='sets.html?set='+encodeURIComponent(previewSet)+'&fit=1';$('outfit-name').textContent='Loading outfit…';$('workshop').inert=true;$('replay').disabled=true;}
try { scene = await createScene($('scene'),previewSet);if(previewSet)$('outfit-name').textContent=scene.previewName+' · Test';if(telegramLaunch)await loadCloud();scene.render(state, 0); start(); }
catch (error) { console.error(error); notify('Could not load the artwork. Refresh the page.'); }

// Only available when explicitly opening ?debug=1 for local verification.
if (localPreview && new URLSearchParams(location.search).get('debug') === '1') {
  window.__forestForge = {
    snapshot: () => structuredClone(state),
    advance(seconds) { for (let i = 0; i < seconds * 30; i++) processEvents(step(state, 1 / 30)); updateUI(); scene?.render(state, 0); save(); },
    get frames() { return frameCount; },
  };
}
