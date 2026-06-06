(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`cat-guide-kckW8obj.png`,import.meta.url).href,t=``+new URL(`cat-guide-sad-C-70Z7wv.png`,import.meta.url).href,n=ee(``),r=new Set([`daily_limit`,`no_pet`,`pet_dead`,`pet_changed`,`not_enough_energy`,`forbidden`]);async function i(e){let t=o();if(!t)return c(e,null);try{let n=await s(`/api/farm-paws/start`,{initData:t}),r=n.runId||n.run_id||null;if(!n.ok||!r){let t=d(n.code);return u(t)?l(e,n.error||t||`start_blocked`,t,n):c(e,n.error||`start_failed`)}return{mode:`server`,runId:r,bestScore:m(n.bestScore??n.best_score??e),error:null,petName:h(n.petName??n.pet_name),code:null,dailyLimit:null,dailyStarts:null}}catch(t){if(t instanceof g&&u(t.code)){let n=t.payload;return l(e,t.message,t.code,n)}return c(e,t instanceof Error?t.message:`network_error`)}}async function a(e,t){let n=o();if(e.mode!==`server`||!e.runId||!n)return{mode:`local`,ok:!0,xpReward:null,bestScore:null,petXp:null,error:null};try{let r=await s(`/api/farm-paws/finish`,{initData:n,runId:e.runId,score:t.score,round:t.round,hpLeft:t.hpLeft,durationMs:t.durationMs});return r.ok?{mode:`server`,ok:!0,xpReward:p(r.xpReward??r.xp_reward),bestScore:p(r.bestScore??r.best_score),petXp:p(r.petXp??r.pet_xp),error:null}:f(r.error||`finish_failed`)}catch(e){return f(e instanceof Error?e.message:`network_error`)}}function o(){return window.Telegram?.WebApp?.initData||``}async function s(e,t){let r=typeof t.initData==`string`?t.initData:o(),i=await fetch(`${n}${e}`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Telegram-Init-Data":r},body:JSON.stringify(t)}),a=await i.json().catch(()=>({}));if(!i.ok)throw new g(i.status,a);return a}function ee(e){return e.trim().replace(/\/+$/,``)}function c(e,t){return{mode:`local`,runId:null,bestScore:m(e),error:t,petName:null,code:null,dailyLimit:null,dailyStarts:null}}function l(e,t,n,r){return{mode:`blocked`,runId:null,bestScore:m(e),error:t,petName:h(r?.petName??r?.pet_name),code:n,dailyLimit:p(r?.dailyLimit??r?.daily_limit),dailyStarts:p(r?.dailyStarts??r?.daily_starts)}}function u(e){return!!(e&&r.has(e))}function d(e){return typeof e==`string`&&e.trim()?e.trim():null}function f(e){return{mode:`server`,ok:!1,xpReward:null,bestScore:null,petXp:null,error:e}}function p(e){return typeof e==`number`&&Number.isFinite(e)?Math.max(0,Math.floor(e)):null}function m(e){return Number.isFinite(e)?Math.max(0,Math.floor(e)):0}function h(e){return typeof e==`string`&&e.trim()?e.trim():null}var g=class extends Error{status;code;payload;constructor(e,t){let n=d(t.code),r=typeof t.error==`string`&&t.error.trim()?t.error.trim():n||`HTTP ${e}`;super(r),this.name=`ApiError`,this.status=e,this.code=n,this.payload=t}},_=9,v=3,y=3,b=7,x=820,S=42,te=420,C=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`],w=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`,`🍓`,`🥭`,`🌶️`,`🫑`,`🍆`,`🫘`];function T(e=0){return{phase:`idle`,round:1,score:0,bestScore:Math.max(0,Math.floor(e)),hp:v,maxHp:v,plotEmojis:[...C],sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null}}function ne(e){return y+Math.max(0,Math.floor(e)-1)}function E(e){let t=x-(Math.max(1,Math.floor(e))-1)*S;return Math.max(te,t)}function D(e){return e<=0?0:Math.max(5,Math.round(e*1.8))}function re(e,t=Math.random){let n=ne(e),r=e>=b,i=[];for(let e=0;e<n;e+=1){let n=M(_,t),a=i[e-1];if(!r&&a)for(;n===a.cellIndex;)n=M(_,t);i.push({cellIndex:n})}return i}function ie(e=Math.random){let t=[...w],n=[];for(let r=0;r<_;r+=1){t.length<1&&t.push(...w);let i=M(t.length,e),[a]=t.splice(i,1);n.push(a||C[r]||`🌱`)}return n}function O(){return[...C]}function ae(e=0,t=Math.random){return j({...T(e),phase:`showing`},1,t)}function oe(e,t=Math.random){return j({...e,round:e.round+1,phase:`showing`,inputIndex:0,lastInputCell:null,lastInputStatus:null},e.round+1,t)}function k(e){return e.phase===`showing`?{...e,phase:`input`,inputIndex:0,lastInputCell:null,lastInputStatus:null}:e}function A(e,t){if(e.phase!==`input`)return{state:e,result:`ignored`};let n=e.sequence[e.inputIndex];if(!n||n.cellIndex!==t){let n=Math.max(0,e.hp-1);return{state:{...e,phase:n<=0?`failed`:`input`,hp:n,bestScore:Math.max(e.bestScore,e.score),lastInputCell:t,lastInputStatus:`wrong`},result:n<=0?`failed`:`mistake`}}let r=e.score+1,i=e.inputIndex+1,a=i>=e.sequence.length;return{state:{...e,phase:a?`success`:`input`,score:r,bestScore:Math.max(e.bestScore,r),inputIndex:i,lastInputCell:t,lastInputStatus:`correct`},result:a?`roundComplete`:`correct`}}function j(e,t,n){return{...e,phase:`showing`,round:t,plotEmojis:ie(n),sequence:re(t,n),inputIndex:0,lastInputCell:null,lastInputStatus:null}}function M(e,t){return Math.max(0,Math.min(e-1,Math.floor(t()*e)))}var N=`farm-paws-best-score-v1`;function P(){try{let e=window.localStorage.getItem(N),t=Number.parseInt(e||`0`,10);return Number.isFinite(t)?Math.max(0,t):0}catch{return 0}}function F(e){try{window.localStorage.setItem(N,String(Math.max(0,Math.floor(e))))}catch{}}var I=ce(),L={phase:`idle`,round:1,score:0,bestScore:P(),hp:3,maxHp:3,plotEmojis:O(),sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null},R=null,z=0,B={mode:`local`,runId:null,bestScore:L.bestScore,error:null,petName:null},V=0,H=!1,U=!1,W=null,G=null,K=null;se(),q();function se(){let e=window.Telegram?.WebApp;if(e)try{e.ready?.(),e.expand?.(),e.setHeaderColor?.(`#fff8df`),e.setBackgroundColor?.(`#fff8df`),e.disableVerticalSwipes?.()}catch{}}function ce(){let e=document.querySelector(`#app`);if(!e)throw Error(`App root was not found.`);return e}function q(){I.innerHTML=`
    <main class="phone-shell">
      <section class="game-card ${L.phase===`failed`?`is-failed`:``}">
        ${L.phase===`idle`?le():ue()}
      </section>
    </main>
  `,I.querySelector(`[data-action='start']`)?.addEventListener(`click`,J),I.querySelector(`[data-action='retry']`)?.addEventListener(`click`,J),I.querySelector(`[data-action='farm']`)?.addEventListener(`click`,()=>{Z(`Ферма будет подключена позже.`)}),I.querySelectorAll(`[data-cell]`).forEach(e=>{e.addEventListener(`click`,()=>{me(Number.parseInt(e.dataset.cell||`-1`,10))})})}function le(){return`
    <div class="start-screen">
      <div class="pet-badge" aria-hidden="true">🐾</div>
      <p class="eyebrow">Прогулка питомца</p>
      <h1>Фермерские лапки</h1>
      <p class="lead">Запомни маршрут питомца по грядкам и повтори его.</p>
      <div class="preview-grid" aria-hidden="true">
        ${Array.from({length:9},(e,t)=>`<span class="preview-plot">${Se(t)}</span>`).join(``)}
      </div>
      <div class="mini-sequence" aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
      <button class="primary-button" data-action="start" ${H?`disabled`:``}>${H?`⏳ Стартуем`:`▶️ Играть`}</button>
      ${K?`<p class="start-warning">${Q(K)}</p>`:``}
      <p class="best-note">Лучший результат: <strong>${L.bestScore}</strong></p>
    </div>
  `}function ue(){let e=L.phase===`failed`;return`
    <header class="top-panel">
      <div>
        <p class="eyebrow">🐾 ${Q(B.petName||`Питомец`)}</p>
        <h1>${e?`Забег окончен`:`Раунд ${L.round}`}</h1>
      </div>
      <div class="score-pill">
        <span>${L.score}</span>
        <small>урожай</small>
      </div>
    </header>

    <section class="stats-row" aria-label="Статистика забега">
      <span>Раунд: <strong>${L.round}</strong></span>
      <span>Рекорд: <strong>${L.bestScore}</strong></span>
    </section>
    <section class="heart-row" aria-label="Жизни">
      <span>Жизни</span>
      <strong>${X()}</strong>
    </section>

    ${e?fe():de()}
  `}function de(){return`
    <div class="status-line ${_e()}">${ge()}</div>
    <div class="farm-grid" aria-label="Грядки">
      ${Array.from({length:9},(e,t)=>pe(t)).join(``)}
    </div>
    <div class="cat-guide-panel" aria-label="Котик помогает запомнить маршрут">
      <img class="cat-guide-image ${ye()}" src="${be()}" alt="" />
    </div>
  `}function fe(){return`
    <div class="result-panel">
      <img class="result-cat-image" src="${t}" alt="" />
      <h2>Урожай спасён: ${L.score}</h2>
      <p>Сердечки закончились.</p>
      <p>Лучший результат: <strong>${L.bestScore}</strong></p>
      <p class="reward-line">${ve()}</p>
      <div class="result-actions">
        <button class="primary-button" data-action="retry">🔁 Ещё раз</button>
        <button class="secondary-button" data-action="farm">🌾 На ферму</button>
      </div>
    </div>
  `}function pe(e){let t=R?.cellIndex===e,n=L.lastInputStatus===`correct`&&L.lastInputCell===e,r=L.lastInputStatus===`wrong`&&L.lastInputCell===e,i=L.plotEmojis[e]||`🌱`;return`
    <button class="${[`plot-button`,t?`is-active`:``,n?`is-correct`:``,r?`is-wrong`:``].filter(Boolean).join(` `)}" data-cell="${e}" ${L.phase===`input`?``:`disabled`} aria-label="Грядка ${e+1}">
      <span class="plot-content">${i}</span>
      ${t?`<span class="plot-pet" aria-hidden="true">🐕</span>`:``}
    </button>
  `}async function J(){if(H)return;z+=1;let e=z,t=P();R=null,U=!1,W=null,G=null,K=null,H=!0,L={...L,phase:`idle`,bestScore:Math.max(L.bestScore,t)},q();let n=await i(t);if(e===z){if(H=!1,n.mode===`blocked`){B=n,K=xe(n),L={...L,phase:`idle`,bestScore:Math.max(L.bestScore,n.bestScore)},q(),Z(K);return}B=n,V=Date.now(),L=ae(n.bestScore),q(),n.mode===`local`&&n.error&&Z(`Игра запущена локально. Награда не начислится.`),Y(e)}}async function Y(e){let t=E(L.round),n=Math.max(110,Math.floor(t*.28));for(let[r,i]of L.sequence.entries()){if(e!==z||(R={cellIndex:i.cellIndex,stepNumber:r+1,totalSteps:L.sequence.length},q(),await $(t),e!==z))return;R=null,q(),await $(n)}e===z&&(L=k(L),q())}function me(e){let t=z,n=A(L,e);L=n.state,R=null,L.bestScore>=L.score&&F(L.bestScore),q(),n.result===`mistake`&&window.setTimeout(()=>{t!==z||L.phase!==`input`||L.lastInputStatus!==`wrong`||(L={...L,lastInputCell:null,lastInputStatus:null},q())},520),n.result===`failed`&&he(t),n.result===`roundComplete`&&window.setTimeout(()=>{t===z&&(L=oe(L),q(),Y(t))},700)}async function he(e){if(U||W)return;U=!0,G=null,q();let t=await a(B,{score:L.score,round:L.round,hpLeft:L.hp,durationMs:Math.max(0,Date.now()-V)});e===z&&(U=!1,W=t,G=t.ok?null:t.error||`finish_failed`,typeof t.bestScore==`number`&&t.bestScore>L.bestScore&&(L={...L,bestScore:t.bestScore},F(t.bestScore)),q())}function ge(){return L.phase===`showing`?`Смотри ${R?.stepNumber||1}/${R?.totalSteps||L.sequence.length}`:L.phase===`success`?`Верно`:L.phase===`failed`?`Ошибка`:L.lastInputStatus===`wrong`?`Минус сердце ${L.hp}/${L.maxHp}`:`Повтори ${Math.min(L.inputIndex+1,L.sequence.length)}/${L.sequence.length}`}function _e(){return L.phase===`showing`?`is-watch`:L.phase===`success`?`is-success`:L.phase===`failed`||L.lastInputStatus===`wrong`?`is-error`:`is-repeat`}function X(){return Array.from({length:L.maxHp},(e,t)=>t<L.hp?`❤️`:`🤍`).join(``)}function ve(){return U||B.mode===`server`&&!W&&!G?`Сохраняем результат...`:W?.mode===`server`&&W.ok?`Питомец получил +${W.xpReward||0} XP`:B.mode===`server`&&G?`Результат не сохранён, награда не начислена`:B.mode===`local`?`Локальный режим: награда не начисляется`:`Питомец получил +${D(L.score)} XP`}function ye(){return L.phase===`showing`?`is-pointing`:L.phase===`success`?`is-happy`:L.lastInputStatus===`wrong`?`is-hurt`:`is-waiting`}function be(){return L.lastInputStatus===`wrong`?t:e}function Z(e){let t=document.createElement(`div`);t.className=`toast`,t.textContent=e,document.body.append(t),window.setTimeout(()=>t.remove(),1800)}function xe(e){if(e.code===`daily_limit`){let t=typeof e.dailyLimit==`number`?e.dailyLimit:null,n=typeof e.dailyStarts==`number`?e.dailyStarts:t;return`Лимит прогулок на сегодня исчерпан${t?` (${Math.min(n||0,t)}/${t})`:``}. Новые попытки будут в 00:00 UTC.`}return e.code===`no_pet`?`Сначала нужен питомец. Открой меню питомца в боте.`:e.code===`pet_dead`?`Питомец не может гулять. Открой меню питомца в боте.`:e.code===`pet_changed`?`Питомец изменился. Закрой мини-игру и открой прогулку заново из бота.`:e.code===`not_enough_energy`?`Не хватает энергии для прогулки.`:`Сейчас прогулку начать нельзя. Открой меню питомца и попробуй позже.`}function Q(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function $(e){return new Promise(t=>window.setTimeout(t,e))}function Se(e){return O()[e]||`🌱`}