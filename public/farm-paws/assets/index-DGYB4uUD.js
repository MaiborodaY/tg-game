(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`cat-guide-kckW8obj.png`,import.meta.url).href,t=``+new URL(`cat-guide-sad-C-70Z7wv.png`,import.meta.url).href,n=``+new URL(`dog-guide-yhwrSna1.png`,import.meta.url).href,r=``+new URL(`dog-guide-sad-gIzwDEJk.png`,import.meta.url).href,i=u(``),a=new Set([`daily_limit`,`no_pet`,`pet_dead`,`pet_changed`,`not_enough_energy`,`forbidden`]);async function o(e){let t=c();if(!t)return d(e,null);try{let n=await l(`/api/farm-paws/start`,{initData:t}),r=n.runId||n.run_id||null;if(!n.ok||!r){let t=m(n.code);return p(t)?f(e,n.error||t||`start_blocked`,t,n):d(e,n.error||`start_failed`)}return{mode:`server`,runId:r,bestScore:_(n.bestScore??n.best_score??e),error:null,petName:v(n.petName??n.pet_name),petType:v(n.petType??n.pet_type),code:null,dailyLimit:null,dailyStarts:null}}catch(t){if(t instanceof y&&p(t.code)){let n=t.payload;return f(e,t.message,t.code,n)}return d(e,t instanceof Error?t.message:`network_error`)}}async function s(e,t){let n=c();if(e.mode!==`server`||!e.runId||!n)return{mode:`local`,ok:!0,xpReward:null,bestScore:null,petXp:null,error:null};try{let r=await l(`/api/farm-paws/finish`,{initData:n,runId:e.runId,score:t.score,round:t.round,hpLeft:t.hpLeft,durationMs:t.durationMs});return r.ok?{mode:`server`,ok:!0,xpReward:g(r.xpReward??r.xp_reward),bestScore:g(r.bestScore??r.best_score),petXp:g(r.petXp??r.pet_xp),error:null}:h(r.error||`finish_failed`)}catch(e){return h(e instanceof Error?e.message:`network_error`)}}function c(){return window.Telegram?.WebApp?.initData||``}async function l(e,t){let n=typeof t.initData==`string`?t.initData:c(),r=await fetch(`${i}${e}`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Telegram-Init-Data":n},body:JSON.stringify(t)}),a=await r.json().catch(()=>({}));if(!r.ok)throw new y(r.status,a);return a}function u(e){return e.trim().replace(/\/+$/,``)}function d(e,t){return{mode:`local`,runId:null,bestScore:_(e),error:t,petName:null,petType:null,code:null,dailyLimit:null,dailyStarts:null}}function f(e,t,n,r){return{mode:`blocked`,runId:null,bestScore:_(e),error:t,petName:v(r?.petName??r?.pet_name),petType:v(r?.petType??r?.pet_type),code:n,dailyLimit:g(r?.dailyLimit??r?.daily_limit),dailyStarts:g(r?.dailyStarts??r?.daily_starts)}}function p(e){return!!(e&&a.has(e))}function m(e){return typeof e==`string`&&e.trim()?e.trim():null}function h(e){return{mode:`server`,ok:!1,xpReward:null,bestScore:null,petXp:null,error:e}}function g(e){return typeof e==`number`&&Number.isFinite(e)?Math.max(0,Math.floor(e)):null}function _(e){return Number.isFinite(e)?Math.max(0,Math.floor(e)):0}function v(e){return typeof e==`string`&&e.trim()?e.trim():null}var y=class extends Error{status;code;payload;constructor(e,t){let n=m(t.code),r=typeof t.error==`string`&&t.error.trim()?t.error.trim():n||`HTTP ${e}`;super(r),this.name=`ApiError`,this.status=e,this.code=n,this.payload=t}},b=9,x=3,S=3,ee=7,te=820,ne=42,re=420,C=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`],w=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`,`🍓`,`🥭`,`🌶️`,`🫑`,`🍆`,`🫘`];function ie(e=0){return{phase:`idle`,round:1,score:0,bestScore:Math.max(0,Math.floor(e)),hp:x,maxHp:x,plotEmojis:[...C],sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null}}function T(e){return S+Math.max(0,Math.floor(e)-1)}function ae(e){let t=te-(Math.max(1,Math.floor(e))-1)*ne;return Math.max(re,t)}function oe(e){return e<=0?0:Math.max(5,Math.round(e*1.8))}function se(e,t=Math.random){let n=T(e),r=e>=ee,i=[];for(let e=0;e<n;e+=1){let n=j(b,t),a=i[e-1];if(!r&&a)for(;n===a.cellIndex;)n=j(b,t);i.push({cellIndex:n})}return i}function ce(e=Math.random){let t=[...w],n=[];for(let r=0;r<b;r+=1){t.length<1&&t.push(...w);let i=j(t.length,e),[a]=t.splice(i,1);n.push(a||C[r]||`🌱`)}return n}function E(){return[...C]}function le(e=0,t=Math.random){return A({...ie(e),phase:`showing`},1,t)}function D(e,t=Math.random){return A({...e,round:e.round+1,phase:`showing`,inputIndex:0,lastInputCell:null,lastInputStatus:null},e.round+1,t)}function O(e){return e.phase===`showing`?{...e,phase:`input`,inputIndex:0,lastInputCell:null,lastInputStatus:null}:e}function k(e,t){if(e.phase!==`input`)return{state:e,result:`ignored`};let n=e.sequence[e.inputIndex];if(!n||n.cellIndex!==t){let n=Math.max(0,e.hp-1);return{state:{...e,phase:n<=0?`failed`:`input`,hp:n,bestScore:Math.max(e.bestScore,e.score),lastInputCell:t,lastInputStatus:`wrong`},result:n<=0?`failed`:`mistake`}}let r=e.score+1,i=e.inputIndex+1,a=i>=e.sequence.length;return{state:{...e,phase:a?`success`:`input`,score:r,bestScore:Math.max(e.bestScore,r),inputIndex:i,lastInputCell:t,lastInputStatus:`correct`},result:a?`roundComplete`:`correct`}}function A(e,t,n){return{...e,phase:`showing`,round:t,plotEmojis:ce(n),sequence:se(t,n),inputIndex:0,lastInputCell:null,lastInputStatus:null}}function j(e,t){return Math.max(0,Math.min(e-1,Math.floor(t()*e)))}var M=`farm-paws-best-score-v1`;function N(){try{let e=window.localStorage.getItem(M),t=Number.parseInt(e||`0`,10);return Number.isFinite(t)?Math.max(0,t):0}catch{return 0}}function P(e){try{window.localStorage.setItem(M,String(Math.max(0,Math.floor(e))))}catch{}}var F=de(),I={phase:`idle`,round:1,score:0,bestScore:N(),hp:3,maxHp:3,plotEmojis:E(),sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null},L=null,R=0,z={mode:`local`,runId:null,bestScore:I.bestScore,error:null,petName:null,petType:null},B=0,V=!1,H=!1,U=null,W=null,G=null;ue(),K();function ue(){let e=window.Telegram?.WebApp;if(e)try{e.ready?.(),e.expand?.(),e.setHeaderColor?.(`#fff8df`),e.setBackgroundColor?.(`#fff8df`),e.disableVerticalSwipes?.()}catch{}}function de(){let e=document.querySelector(`#app`);if(!e)throw Error(`App root was not found.`);return e}function K(){F.innerHTML=`
    <main class="phone-shell">
      <section class="game-card ${I.phase===`failed`?`is-failed`:``}">
        ${I.phase===`idle`?fe():pe()}
      </section>
    </main>
  `,F.querySelector(`[data-action='start']`)?.addEventListener(`click`,J),F.querySelector(`[data-action='retry']`)?.addEventListener(`click`,J),F.querySelector(`[data-action='home']`)?.addEventListener(`click`,Ce),F.querySelectorAll(`[data-cell]`).forEach(e=>{e.addEventListener(`click`,()=>{ge(Number.parseInt(e.dataset.cell||`-1`,10))})})}function fe(){return`
    <div class="start-screen">
      <div class="pet-badge" aria-hidden="true">🐾</div>
      <p class="eyebrow">Прогулка питомца</p>
      <h1>Фермерские лапки</h1>
      <p class="lead">Запомни маршрут питомца по грядкам и повтори его.</p>
      <div class="preview-grid" aria-hidden="true">
        ${Array.from({length:9},(e,t)=>`<span class="preview-plot">${Te(t)}</span>`).join(``)}
      </div>
      <div class="mini-sequence" aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
      <button class="primary-button" data-action="start" ${V?`disabled`:``}>${V?`⏳ Стартуем`:`▶️ Играть`}</button>
      ${G?`<p class="start-warning">${Q(G)}</p>`:``}
      <p class="best-note">Лучший результат: <strong>${I.bestScore}</strong></p>
    </div>
  `}function pe(){let e=I.phase===`failed`;return`
    <header class="top-panel">
      <div>
        <p class="eyebrow">🐾 ${Q(z.petName||`Питомец`)}</p>
        <h1>${e?`Забег окончен`:`Раунд ${I.round}`}</h1>
      </div>
      <div class="score-pill">
        <span>${I.score}</span>
        <small>урожай</small>
      </div>
    </header>

    <section class="stats-row" aria-label="Статистика забега">
      <span>Раунд: <strong>${I.round}</strong></span>
      <span>Рекорд: <strong>${I.bestScore}</strong></span>
    </section>
    <section class="heart-row" aria-label="Жизни">
      <span>Жизни</span>
      <strong>${be()}</strong>
    </section>

    ${e?me():q()}
  `}function q(){return`
    <div class="status-line ${ye()}">${ve()}</div>
    <div class="farm-grid" aria-label="Грядки">
      ${Array.from({length:9},(e,t)=>he(t)).join(``)}
    </div>
    <div class="cat-guide-panel" aria-label="Питомец помогает запомнить маршрут">
      <img class="cat-guide-image ${Se()}" src="${X(!1)}" alt="" />
    </div>
  `}function me(){return`
    <div class="result-panel">
      <img class="result-cat-image" src="${X(!0)}" alt="" />
      <h2>Урожай спасён: ${I.score}</h2>
      <p>Сердечки закончились.</p>
      <p>Лучший результат: <strong>${I.bestScore}</strong></p>
      <p class="reward-line">${xe()}</p>
      <div class="result-actions">
        <button class="primary-button" data-action="retry">🔁 Ещё раз</button>
        <button class="secondary-button" data-action="home">🏠 В дом</button>
      </div>
    </div>
  `}function he(e){let t=L?.cellIndex===e,n=I.lastInputStatus===`correct`&&I.lastInputCell===e,r=I.lastInputStatus===`wrong`&&I.lastInputCell===e,i=I.plotEmojis[e]||`🌱`;return`
    <button class="${[`plot-button`,t?`is-active`:``,n?`is-correct`:``,r?`is-wrong`:``].filter(Boolean).join(` `)}" data-cell="${e}" ${I.phase===`input`?``:`disabled`} aria-label="Грядка ${e+1}">
      <span class="plot-content">${i}</span>
      ${t?`<span class="plot-pet" aria-hidden="true">🐕</span>`:``}
    </button>
  `}async function J(){if(V)return;R+=1;let e=R,t=N();L=null,H=!1,U=null,W=null,G=null,V=!0,I={...I,phase:`idle`,bestScore:Math.max(I.bestScore,t)},K();let n=await o(t);if(e===R){if(V=!1,n.mode===`blocked`){z=n,G=we(n),I={...I,phase:`idle`,bestScore:Math.max(I.bestScore,n.bestScore)},K(),Z(G);return}z=n,B=Date.now(),I=le(n.bestScore),K(),n.mode===`local`&&n.error&&Z(`Игра запущена локально. Награда не начислится.`),Y(e)}}async function Y(e){let t=ae(I.round),n=Math.max(110,Math.floor(t*.28));for(let[r,i]of I.sequence.entries()){if(e!==R||(L={cellIndex:i.cellIndex,stepNumber:r+1,totalSteps:I.sequence.length},K(),await $(t),e!==R))return;L=null,K(),await $(n)}e===R&&(I=O(I),K())}function ge(e){let t=R,n=k(I,e);I=n.state,L=null,I.bestScore>=I.score&&P(I.bestScore),K(),n.result===`mistake`&&window.setTimeout(()=>{t!==R||I.phase!==`input`||I.lastInputStatus!==`wrong`||(I={...I,lastInputCell:null,lastInputStatus:null},K())},520),n.result===`failed`&&_e(t),n.result===`roundComplete`&&window.setTimeout(()=>{t===R&&(I=D(I),K(),Y(t))},700)}async function _e(e){if(H||U)return;H=!0,W=null,K();let t=await s(z,{score:I.score,round:I.round,hpLeft:I.hp,durationMs:Math.max(0,Date.now()-B)});e===R&&(H=!1,U=t,W=t.ok?null:t.error||`finish_failed`,typeof t.bestScore==`number`&&t.bestScore>I.bestScore&&(I={...I,bestScore:t.bestScore},P(t.bestScore)),K())}function ve(){return I.phase===`showing`?`Смотри ${L?.stepNumber||1}/${L?.totalSteps||I.sequence.length}`:I.phase===`success`?`Верно`:I.phase===`failed`?`Ошибка`:I.lastInputStatus===`wrong`?`Минус сердце ${I.hp}/${I.maxHp}`:`Повтори ${Math.min(I.inputIndex+1,I.sequence.length)}/${I.sequence.length}`}function ye(){return I.phase===`showing`?`is-watch`:I.phase===`success`?`is-success`:I.phase===`failed`||I.lastInputStatus===`wrong`?`is-error`:`is-repeat`}function be(){return Array.from({length:I.maxHp},(e,t)=>t<I.hp?`❤️`:`🤍`).join(``)}function xe(){return H||z.mode===`server`&&!U&&!W?`Сохраняем результат...`:U?.mode===`server`&&U.ok?`Питомец получил +${U.xpReward||0} XP`:z.mode===`server`&&W?`Результат не сохранён, награда не начислена`:z.mode===`local`?`Локальный режим: награда не начисляется`:`Питомец получил +${oe(I.score)} XP`}function Se(){return I.phase===`showing`?`is-pointing`:I.phase===`success`?`is-happy`:I.lastInputStatus===`wrong`?`is-hurt`:`is-waiting`}function X(i=!1){let a=i||I.lastInputStatus===`wrong`;return z.petType===`dog`?a?r:n:a?t:e}function Z(e){let t=document.createElement(`div`);t.className=`toast`,t.textContent=e,document.body.append(t),window.setTimeout(()=>t.remove(),1800)}function Ce(){try{let e=window.Telegram?.WebApp?.close;if(typeof e==`function`){e();return}}catch{}Z(`Закрой мини-игру, чтобы вернуться домой.`)}function we(e){if(e.code===`daily_limit`){let t=typeof e.dailyLimit==`number`?e.dailyLimit:null,n=typeof e.dailyStarts==`number`?e.dailyStarts:t;return`Лимит прогулок на сегодня исчерпан${t?` (${Math.min(n||0,t)}/${t})`:``}. Новые попытки будут в 00:00 UTC.`}return e.code===`no_pet`?`Сначала нужен питомец. Открой меню питомца в боте.`:e.code===`pet_dead`?`Питомец не может гулять. Открой меню питомца в боте.`:e.code===`pet_changed`?`Питомец изменился. Закрой мини-игру и открой прогулку заново из бота.`:e.code===`not_enough_energy`?`Не хватает энергии для прогулки.`:`Сейчас прогулку начать нельзя. Открой меню питомца и попробуй позже.`}function Q(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function $(e){return new Promise(t=>window.setTimeout(t,e))}function Te(e){return E()[e]||`🌱`}