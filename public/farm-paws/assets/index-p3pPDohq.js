(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`cat-guide-kckW8obj.png`,import.meta.url).href,t=``+new URL(`cat-guide-sad-C-70Z7wv.png`,import.meta.url).href,n=s(``);async function r(e){let t=a();if(!t)return c(e,null);try{let n=await o(`/api/farm-paws/start`,{initData:t}),r=n.runId||n.run_id||null;return!n.ok||!r?c(e,n.error||`start_failed`):{mode:`server`,runId:r,bestScore:d(n.bestScore??n.best_score??e),error:null}}catch(t){return c(e,t instanceof Error?t.message:`network_error`)}}async function i(e,t){let n=a();if(e.mode!==`server`||!e.runId||!n)return{mode:`local`,ok:!0,xpReward:null,bestScore:null,petXp:null,error:null};try{let r=await o(`/api/farm-paws/finish`,{initData:n,runId:e.runId,score:t.score,round:t.round,hpLeft:t.hpLeft,durationMs:t.durationMs});return r.ok?{mode:`server`,ok:!0,xpReward:u(r.xpReward??r.xp_reward),bestScore:u(r.bestScore??r.best_score),petXp:u(r.petXp??r.pet_xp),error:null}:l(r.error||`finish_failed`)}catch(e){return l(e instanceof Error?e.message:`network_error`)}}function a(){return window.Telegram?.WebApp?.initData||``}async function o(e,t){let r=typeof t.initData==`string`?t.initData:a(),i=await fetch(`${n}${e}`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Telegram-Init-Data":r},body:JSON.stringify(t)}),o=await i.json().catch(()=>({}));if(!i.ok)throw Error(typeof o.error==`string`?o.error:`HTTP ${i.status}`);return o}function s(e){return e.trim().replace(/\/+$/,``)}function c(e,t){return{mode:`local`,runId:null,bestScore:d(e),error:t}}function l(e){return{mode:`server`,ok:!1,xpReward:null,bestScore:null,petXp:null,error:e}}function u(e){return typeof e==`number`&&Number.isFinite(e)?Math.max(0,Math.floor(e)):null}function d(e){return Number.isFinite(e)?Math.max(0,Math.floor(e)):0}var f=9,p=3,m=3,h=7,g=820,_=42,v=420,y=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`],b=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`,`🍓`,`🥭`,`🌶️`,`🫑`,`🍆`,`🫘`];function x(e=0){return{phase:`idle`,round:1,score:0,bestScore:Math.max(0,Math.floor(e)),hp:p,maxHp:p,plotEmojis:[...y],sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null}}function S(e){return m+Math.max(0,Math.floor(e)-1)}function C(e){let t=g-(Math.max(1,Math.floor(e))-1)*_;return Math.max(v,t)}function w(e){return e<=0?0:Math.max(5,Math.round(e*1.8))}function T(e,t=Math.random){let n=S(e),r=e>=h,i=[];for(let e=0;e<n;e+=1){let n=k(f,t),a=i[e-1];if(!r&&a)for(;n===a.cellIndex;)n=k(f,t);i.push({cellIndex:n})}return i}function E(e=Math.random){let t=[...b],n=[];for(let r=0;r<f;r+=1){t.length<1&&t.push(...b);let i=k(t.length,e),[a]=t.splice(i,1);n.push(a||y[r]||`🌱`)}return n}function D(){return[...y]}function ee(e=0,t=Math.random){return O({...x(e),phase:`showing`},1,t)}function te(e,t=Math.random){return O({...e,round:e.round+1,phase:`showing`,inputIndex:0,lastInputCell:null,lastInputStatus:null},e.round+1,t)}function ne(e){return e.phase===`showing`?{...e,phase:`input`,inputIndex:0,lastInputCell:null,lastInputStatus:null}:e}function re(e,t){if(e.phase!==`input`)return{state:e,result:`ignored`};let n=e.sequence[e.inputIndex];if(!n||n.cellIndex!==t){let n=Math.max(0,e.hp-1);return{state:{...e,phase:n<=0?`failed`:`input`,hp:n,bestScore:Math.max(e.bestScore,e.score),lastInputCell:t,lastInputStatus:`wrong`},result:n<=0?`failed`:`mistake`}}let r=e.score+1,i=e.inputIndex+1,a=i>=e.sequence.length;return{state:{...e,phase:a?`success`:`input`,score:r,bestScore:Math.max(e.bestScore,r),inputIndex:i,lastInputCell:t,lastInputStatus:`correct`},result:a?`roundComplete`:`correct`}}function O(e,t,n){return{...e,phase:`showing`,round:t,plotEmojis:E(n),sequence:T(t,n),inputIndex:0,lastInputCell:null,lastInputStatus:null}}function k(e,t){return Math.max(0,Math.min(e-1,Math.floor(t()*e)))}var A=`farm-paws-best-score-v1`;function j(){try{let e=window.localStorage.getItem(A),t=Number.parseInt(e||`0`,10);return Number.isFinite(t)?Math.max(0,t):0}catch{return 0}}function M(e){try{window.localStorage.setItem(A,String(Math.max(0,Math.floor(e))))}catch{}}var N=document.querySelector(`#app`);if(!N)throw Error(`App root was not found.`);var P={phase:`idle`,round:1,score:0,bestScore:j(),hp:3,maxHp:3,plotEmojis:D(),sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null},F=null,I=0,L={mode:`local`,runId:null,bestScore:P.bestScore,error:null},R=0,z=!1,B=!1,V=null,H=null;U(),W();function U(){let e=window.Telegram?.WebApp;if(e)try{e.ready?.(),e.expand?.(),e.setHeaderColor?.(`#fff8df`),e.setBackgroundColor?.(`#fff8df`),e.disableVerticalSwipes?.()}catch{}}function W(){N.innerHTML=`
    <main class="phone-shell">
      <section class="game-card ${P.phase===`failed`?`is-failed`:``}">
        ${P.phase===`idle`?G():K()}
      </section>
    </main>
  `,N.querySelector(`[data-action='start']`)?.addEventListener(`click`,X),N.querySelector(`[data-action='retry']`)?.addEventListener(`click`,X),N.querySelector(`[data-action='farm']`)?.addEventListener(`click`,()=>{Q(`Ферма будет подключена позже.`)}),N.querySelectorAll(`[data-cell]`).forEach(e=>{e.addEventListener(`click`,()=>{ie(Number.parseInt(e.dataset.cell||`-1`,10))})})}function G(){return`
    <div class="start-screen">
      <div class="pet-badge" aria-hidden="true">🐾</div>
      <p class="eyebrow">Локальный прототип</p>
      <h1>Фермерские лапки</h1>
      <p class="lead">Запомни маршрут питомца по грядкам и повтори его.</p>
      <div class="preview-grid" aria-hidden="true">
        ${Array.from({length:9},(e,t)=>`<span class="preview-plot">${fe(t)}</span>`).join(``)}
      </div>
      <div class="mini-sequence" aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
      <button class="primary-button" data-action="start" ${z?`disabled`:``}>${z?`⏳ Стартуем`:`▶️ Играть`}</button>
      <p class="best-note">Лучший результат: <strong>${P.bestScore}</strong></p>
    </div>
  `}function K(){let e=P.phase===`failed`;return`
    <header class="top-panel">
      <div>
        <p class="eyebrow">🐾 Фермерские лапки</p>
        <h1>${e?`Забег окончен`:`Раунд ${P.round}`}</h1>
      </div>
      <div class="score-pill">
        <span>${P.score}</span>
        <small>урожай</small>
      </div>
    </header>

    <section class="stats-row" aria-label="Статистика забега">
      <span>Раунд: <strong>${P.round}</strong></span>
      <span>Рекорд: <strong>${P.bestScore}</strong></span>
    </section>
    <section class="heart-row" aria-label="Жизни">
      <span>Жизни</span>
      <strong>${ce()}</strong>
    </section>

    ${e?J():q()}
  `}function q(){return`
    <div class="status-line ${se()}">${oe()}</div>
    <div class="farm-grid" aria-label="Грядки">
      ${Array.from({length:9},(e,t)=>Y(t)).join(``)}
    </div>
    <div class="cat-guide-panel" aria-label="Котик помогает запомнить маршрут">
      <img class="cat-guide-image ${ue()}" src="${de()}" alt="" />
    </div>
  `}function J(){return`
    <div class="result-panel">
      <img class="result-cat-image" src="${t}" alt="" />
      <h2>Урожай спасён: ${P.score}</h2>
      <p>Сердечки закончились.</p>
      <p>Лучший результат: <strong>${P.bestScore}</strong></p>
      <p class="reward-line">${le()}</p>
      <div class="result-actions">
        <button class="primary-button" data-action="retry">🔁 Ещё раз</button>
        <button class="secondary-button" data-action="farm">🌾 На ферму</button>
      </div>
    </div>
  `}function Y(e){let t=F?.cellIndex===e,n=P.lastInputStatus===`correct`&&P.lastInputCell===e,r=P.lastInputStatus===`wrong`&&P.lastInputCell===e,i=P.plotEmojis[e]||`🌱`;return`
    <button class="${[`plot-button`,t?`is-active`:``,n?`is-correct`:``,r?`is-wrong`:``].filter(Boolean).join(` `)}" data-cell="${e}" ${P.phase===`input`?``:`disabled`} aria-label="Грядка ${e+1}">
      <span class="plot-content">${i}</span>
      ${t?`<span class="plot-pet" aria-hidden="true">🐕</span>`:``}
    </button>
  `}async function X(){if(z)return;I+=1;let e=I,t=j();F=null,B=!1,V=null,H=null,z=!0,P={...P,phase:`idle`,bestScore:Math.max(P.bestScore,t)},W();let n=await r(t);e===I&&(L=n,R=Date.now(),z=!1,P=ee(n.bestScore),W(),n.mode===`local`&&n.error&&Q(`Игра запущена локально. Награда не начислится.`),Z(e))}async function Z(e){let t=C(P.round),n=Math.max(110,Math.floor(t*.28));for(let[r,i]of P.sequence.entries()){if(e!==I||(F={cellIndex:i.cellIndex,stepNumber:r+1,totalSteps:P.sequence.length},W(),await $(t),e!==I))return;F=null,W(),await $(n)}e===I&&(P=ne(P),W())}function ie(e){let t=I,n=re(P,e);P=n.state,F=null,P.bestScore>=P.score&&M(P.bestScore),W(),n.result===`mistake`&&window.setTimeout(()=>{t!==I||P.phase!==`input`||P.lastInputStatus!==`wrong`||(P={...P,lastInputCell:null,lastInputStatus:null},W())},520),n.result===`failed`&&ae(t),n.result===`roundComplete`&&window.setTimeout(()=>{t===I&&(P=te(P),W(),Z(t))},700)}async function ae(e){if(B||V)return;B=!0,H=null,W();let t=await i(L,{score:P.score,round:P.round,hpLeft:P.hp,durationMs:Math.max(0,Date.now()-R)});e===I&&(B=!1,V=t,H=t.ok?null:t.error||`finish_failed`,typeof t.bestScore==`number`&&t.bestScore>P.bestScore&&(P={...P,bestScore:t.bestScore},M(t.bestScore)),W())}function oe(){return P.phase===`showing`?`Смотри ${F?.stepNumber||1}/${F?.totalSteps||P.sequence.length}`:P.phase===`success`?`Верно`:P.phase===`failed`?`Ошибка`:P.lastInputStatus===`wrong`?`Минус сердце ${P.hp}/${P.maxHp}`:`Повтори ${Math.min(P.inputIndex+1,P.sequence.length)}/${P.sequence.length}`}function se(){return P.phase===`showing`?`is-watch`:P.phase===`success`?`is-success`:P.phase===`failed`||P.lastInputStatus===`wrong`?`is-error`:`is-repeat`}function ce(){return Array.from({length:P.maxHp},(e,t)=>t<P.hp?`❤️`:`🤍`).join(``)}function le(){return B||L.mode===`server`&&!V&&!H?`Сохраняем результат...`:V?.mode===`server`&&V.ok?`Питомец получил +${V.xpReward||0} XP`:L.mode===`server`&&H?`Результат не сохранён, награда не начислена`:L.mode===`local`?`Локальный режим: награда не начисляется`:`Питомец получил +${w(P.score)} XP`}function ue(){return P.phase===`showing`?`is-pointing`:P.phase===`success`?`is-happy`:P.lastInputStatus===`wrong`?`is-hurt`:`is-waiting`}function de(){return P.lastInputStatus===`wrong`?t:e}function Q(e){let t=document.createElement(`div`);t.className=`toast`,t.textContent=e,document.body.append(t),window.setTimeout(()=>t.remove(),1800)}function $(e){return new Promise(t=>window.setTimeout(t,e))}function fe(e){return D()[e]||`🌱`}