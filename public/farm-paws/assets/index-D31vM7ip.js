(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`cat-guide-kckW8obj.png`,import.meta.url).href,t=``+new URL(`cat-guide-sad-C-70Z7wv.png`,import.meta.url).href,n=9,r=3,i=3,a=7,o=820,s=42,c=420,l=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`],u=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`,`🍓`,`🥭`,`🌶️`,`🫑`,`🍆`,`🫘`];function d(e=0){return{phase:`idle`,round:1,score:0,bestScore:Math.max(0,Math.floor(e)),hp:r,maxHp:r,plotEmojis:[...l],sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null}}function f(e){return i+Math.max(0,Math.floor(e)-1)}function p(e){let t=o-(Math.max(1,Math.floor(e))-1)*s;return Math.max(c,t)}function m(e){return e<=0?0:Math.max(5,Math.round(e*1.8))}function h(e,t=Math.random){let r=f(e),i=e>=a,o=[];for(let e=0;e<r;e+=1){let r=C(n,t),a=o[e-1];if(!i&&a)for(;r===a.cellIndex;)r=C(n,t);o.push({cellIndex:r})}return o}function g(e=Math.random){let t=[...u],r=[];for(let i=0;i<n;i+=1){t.length<1&&t.push(...u);let n=C(t.length,e),[a]=t.splice(n,1);r.push(a||l[i]||`🌱`)}return r}function _(){return[...l]}function v(e=0,t=Math.random){return S({...d(e),phase:`showing`},1,t)}function y(e,t=Math.random){return S({...e,round:e.round+1,phase:`showing`,inputIndex:0,lastInputCell:null,lastInputStatus:null},e.round+1,t)}function b(e){return e.phase===`showing`?{...e,phase:`input`,inputIndex:0,lastInputCell:null,lastInputStatus:null}:e}function x(e,t){if(e.phase!==`input`)return{state:e,result:`ignored`};let n=e.sequence[e.inputIndex];if(!n||n.cellIndex!==t){let n=Math.max(0,e.hp-1);return{state:{...e,phase:n<=0?`failed`:`input`,hp:n,bestScore:Math.max(e.bestScore,e.score),lastInputCell:t,lastInputStatus:`wrong`},result:n<=0?`failed`:`mistake`}}let r=e.score+1,i=e.inputIndex+1,a=i>=e.sequence.length;return{state:{...e,phase:a?`success`:`input`,score:r,bestScore:Math.max(e.bestScore,r),inputIndex:i,lastInputCell:t,lastInputStatus:`correct`},result:a?`roundComplete`:`correct`}}function S(e,t,n){return{...e,phase:`showing`,round:t,plotEmojis:g(n),sequence:h(t,n),inputIndex:0,lastInputCell:null,lastInputStatus:null}}function C(e,t){return Math.max(0,Math.min(e-1,Math.floor(t()*e)))}var w=`farm-paws-best-score-v1`;function T(){try{let e=window.localStorage.getItem(w),t=Number.parseInt(e||`0`,10);return Number.isFinite(t)?Math.max(0,t):0}catch{return 0}}function E(e){try{window.localStorage.setItem(w,String(Math.max(0,Math.floor(e))))}catch{}}var D=document.querySelector(`#app`);if(!D)throw Error(`App root was not found.`);var O={phase:`idle`,round:1,score:0,bestScore:T(),hp:3,maxHp:3,plotEmojis:_(),sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null},k=null,A=0;j();function j(){D.innerHTML=`
    <main class="phone-shell">
      <section class="game-card ${O.phase===`failed`?`is-failed`:``}">
        ${O.phase===`idle`?M():N()}
      </section>
    </main>
  `,D.querySelector(`[data-action='start']`)?.addEventListener(`click`,L),D.querySelector(`[data-action='retry']`)?.addEventListener(`click`,L),D.querySelector(`[data-action='farm']`)?.addEventListener(`click`,()=>{G(`Ферма будет подключена позже.`)}),D.querySelectorAll(`[data-cell]`).forEach(e=>{e.addEventListener(`click`,()=>{z(Number.parseInt(e.dataset.cell||`-1`,10))})})}function M(){return`
    <div class="start-screen">
      <div class="pet-badge" aria-hidden="true">🐾</div>
      <p class="eyebrow">Локальный прототип</p>
      <h1>Фермерские лапки</h1>
      <p class="lead">Запомни маршрут питомца по грядкам и повтори его.</p>
      <div class="preview-grid" aria-hidden="true">
        ${Array.from({length:9},(e,t)=>`<span class="preview-plot">${q(t)}</span>`).join(``)}
      </div>
      <div class="mini-sequence" aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
      <button class="primary-button" data-action="start">▶️ Играть</button>
      <p class="best-note">Лучший результат: <strong>${O.bestScore}</strong></p>
    </div>
  `}function N(){let e=O.phase===`failed`;return`
    <header class="top-panel">
      <div>
        <p class="eyebrow">🐾 Фермерские лапки</p>
        <h1>${e?`Забег окончен`:`Раунд ${O.round}`}</h1>
      </div>
      <div class="score-pill">
        <span>${O.score}</span>
        <small>урожай</small>
      </div>
    </header>

    <section class="stats-row" aria-label="Статистика забега">
      <span>Раунд: <strong>${O.round}</strong></span>
      <span>Рекорд: <strong>${O.bestScore}</strong></span>
    </section>
    <section class="heart-row" aria-label="Жизни">
      <span>Жизни</span>
      <strong>${H()}</strong>
    </section>

    ${e?F():P()}
  `}function P(){return`
    <div class="status-line ${V()}">${B()}</div>
    <div class="farm-grid" aria-label="Грядки">
      ${Array.from({length:9},(e,t)=>I(t)).join(``)}
    </div>
    <div class="cat-guide-panel" aria-label="Котик помогает запомнить маршрут">
      <img class="cat-guide-image ${U()}" src="${W()}" alt="" />
    </div>
  `}function F(){let e=m(O.score);return`
    <div class="result-panel">
      <img class="result-cat-image" src="${t}" alt="" />
      <h2>Урожай спасён: ${O.score}</h2>
      <p>Сердечки закончились.</p>
      <p>Лучший результат: <strong>${O.bestScore}</strong></p>
      <p class="reward-line">Питомец получил +${e} XP</p>
      <div class="result-actions">
        <button class="primary-button" data-action="retry">🔁 Ещё раз</button>
        <button class="secondary-button" data-action="farm">🌾 На ферму</button>
      </div>
    </div>
  `}function I(e){let t=k?.cellIndex===e,n=O.lastInputStatus===`correct`&&O.lastInputCell===e,r=O.lastInputStatus===`wrong`&&O.lastInputCell===e,i=O.plotEmojis[e]||`🌱`;return`
    <button class="${[`plot-button`,t?`is-active`:``,n?`is-correct`:``,r?`is-wrong`:``].filter(Boolean).join(` `)}" data-cell="${e}" ${O.phase===`input`?``:`disabled`} aria-label="Грядка ${e+1}">
      <span class="plot-content">${i}</span>
      ${t?`<span class="plot-pet" aria-hidden="true">🐕</span>`:``}
    </button>
  `}function L(){A+=1,k=null,O=v(T()),j(),R(A)}async function R(e){let t=p(O.round),n=Math.max(110,Math.floor(t*.28));for(let[r,i]of O.sequence.entries()){if(e!==A||(k={cellIndex:i.cellIndex,stepNumber:r+1,totalSteps:O.sequence.length},j(),await K(t),e!==A))return;k=null,j(),await K(n)}e===A&&(O=b(O),j())}function z(e){let t=A,n=x(O,e);O=n.state,k=null,O.bestScore>=O.score&&E(O.bestScore),j(),n.result===`mistake`&&window.setTimeout(()=>{t!==A||O.phase!==`input`||O.lastInputStatus!==`wrong`||(O={...O,lastInputCell:null,lastInputStatus:null},j())},520),n.result===`roundComplete`&&window.setTimeout(()=>{t===A&&(O=y(O),j(),R(t))},700)}function B(){return O.phase===`showing`?`Смотри ${k?.stepNumber||1}/${k?.totalSteps||O.sequence.length}`:O.phase===`success`?`Верно`:O.phase===`failed`?`Ошибка`:O.lastInputStatus===`wrong`?`Минус сердце ${O.hp}/${O.maxHp}`:`Повтори ${Math.min(O.inputIndex+1,O.sequence.length)}/${O.sequence.length}`}function V(){return O.phase===`showing`?`is-watch`:O.phase===`success`?`is-success`:O.phase===`failed`||O.lastInputStatus===`wrong`?`is-error`:`is-repeat`}function H(){return Array.from({length:O.maxHp},(e,t)=>t<O.hp?`❤️`:`🤍`).join(``)}function U(){return O.phase===`showing`?`is-pointing`:O.phase===`success`?`is-happy`:O.lastInputStatus===`wrong`?`is-hurt`:`is-waiting`}function W(){return O.lastInputStatus===`wrong`?t:e}function G(e){let t=document.createElement(`div`);t.className=`toast`,t.textContent=e,document.body.append(t),window.setTimeout(()=>t.remove(),1800)}function K(e){return new Promise(t=>window.setTimeout(t,e))}function q(e){return _()[e]||`🌱`}