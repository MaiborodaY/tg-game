(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`cat-guide-kckW8obj.png`,import.meta.url).href,t=``+new URL(`cat-guide-sad-C-70Z7wv.png`,import.meta.url).href,n=``+new URL(`dog-guide-yhwrSna1.png`,import.meta.url).href,r=``+new URL(`dog-guide-sad-gIzwDEJk.png`,import.meta.url).href,i=l(``),a=new Set([`daily_limit`,`no_pet`,`pet_dead`,`pet_changed`,`not_enough_energy`,`forbidden`]);async function ee(e){let t=s();if(!t)return u(e,null);try{let n=await c(`/api/farm-paws/start`,{initData:t}),r=n.runId||n.run_id||null;if(!n.ok||!r){let t=p(n.code);return f(t)?d(e,n.error||t||`start_blocked`,t,n):u(e,n.error||`start_failed`)}return{mode:`server`,runId:r,bestScore:g(n.bestScore??n.best_score??e),error:null,petName:_(n.petName??n.pet_name),petType:_(n.petType??n.pet_type),code:null,dailyLimit:null,dailyStarts:null}}catch(t){if(t instanceof v&&f(t.code)){let n=t.payload;return d(e,t.message,t.code,n)}return u(e,t instanceof Error?t.message:`network_error`)}}async function o(e,t){let n=s();if(e.mode!==`server`||!e.runId||!n)return{mode:`local`,ok:!0,xpReward:null,bestScore:null,petXp:null,error:null};try{let r=await c(`/api/farm-paws/finish`,{initData:n,runId:e.runId,score:t.score,round:t.round,hpLeft:t.hpLeft,durationMs:t.durationMs});return r.ok?{mode:`server`,ok:!0,xpReward:h(r.xpReward??r.xp_reward),bestScore:h(r.bestScore??r.best_score),petXp:h(r.petXp??r.pet_xp),error:null}:m(r.error||`finish_failed`)}catch(e){return m(e instanceof Error?e.message:`network_error`)}}function s(){return window.Telegram?.WebApp?.initData||``}async function c(e,t){let n=typeof t.initData==`string`?t.initData:s(),r=await fetch(`${i}${e}`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Telegram-Init-Data":n},body:JSON.stringify(t)}),a=await r.json().catch(()=>({}));if(!r.ok)throw new v(r.status,a);return a}function l(e){return e.trim().replace(/\/+$/,``)}function u(e,t){return{mode:`local`,runId:null,bestScore:g(e),error:t,petName:null,petType:null,code:null,dailyLimit:null,dailyStarts:null}}function d(e,t,n,r){return{mode:`blocked`,runId:null,bestScore:g(e),error:t,petName:_(r?.petName??r?.pet_name),petType:_(r?.petType??r?.pet_type),code:n,dailyLimit:h(r?.dailyLimit??r?.daily_limit),dailyStarts:h(r?.dailyStarts??r?.daily_starts)}}function f(e){return!!(e&&a.has(e))}function p(e){return typeof e==`string`&&e.trim()?e.trim():null}function m(e){return{mode:`server`,ok:!1,xpReward:null,bestScore:null,petXp:null,error:e}}function h(e){return typeof e==`number`&&Number.isFinite(e)?Math.max(0,Math.floor(e)):null}function g(e){return Number.isFinite(e)?Math.max(0,Math.floor(e)):0}function _(e){return typeof e==`string`&&e.trim()?e.trim():null}var v=class extends Error{status;code;payload;constructor(e,t){let n=p(t.code),r=typeof t.error==`string`&&t.error.trim()?t.error.trim():n||`HTTP ${e}`;super(r),this.name=`ApiError`,this.status=e,this.code=n,this.payload=t}},y=9,b=3,x=3,S=7,te=820,ne=42,re=420,C=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`],w=[`🌱`,`🌿`,`🌾`,`🥕`,`🥬`,`🥒`,`🍅`,`🌽`,`🥔`,`🍓`,`🥭`,`🌶️`,`🫑`,`🍆`,`🫘`];function ie(e=0){return{phase:`idle`,round:1,score:0,bestScore:Math.max(0,Math.floor(e)),hp:b,maxHp:b,plotEmojis:[...C],sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null}}function ae(e){return x+Math.max(0,Math.floor(e)-1)}function oe(e){let t=te-(Math.max(1,Math.floor(e))-1)*ne;return Math.max(re,t)}function se(e){return e<=0?0:Math.max(5,Math.round(e*1.8))}function ce(e,t=Math.random){let n=ae(e),r=e>=S,i=[];for(let e=0;e<n;e+=1){let n=A(y,t),a=i[e-1];if(!r&&a)for(;n===a.cellIndex;)n=A(y,t);i.push({cellIndex:n})}return i}function le(e=Math.random){let t=[...w],n=[];for(let r=0;r<y;r+=1){t.length<1&&t.push(...w);let i=A(t.length,e),[a]=t.splice(i,1);n.push(a||C[r]||`🌱`)}return n}function T(){return[...C]}function ue(e=0,t=Math.random){return k({...ie(e),phase:`showing`},1,t)}function E(e,t=Math.random){return k({...e,round:e.round+1,phase:`showing`,inputIndex:0,lastInputCell:null,lastInputStatus:null},e.round+1,t)}function D(e){return e.phase===`showing`?{...e,phase:`input`,inputIndex:0,lastInputCell:null,lastInputStatus:null}:e}function O(e,t){if(e.phase!==`input`)return{state:e,result:`ignored`};let n=e.sequence[e.inputIndex];if(!n||n.cellIndex!==t){let n=Math.max(0,e.hp-1);return{state:{...e,phase:n<=0?`failed`:`input`,hp:n,bestScore:Math.max(e.bestScore,e.score),lastInputCell:t,lastInputStatus:`wrong`},result:n<=0?`failed`:`mistake`}}let r=e.score+1,i=e.inputIndex+1,a=i>=e.sequence.length;return{state:{...e,phase:a?`success`:`input`,score:r,bestScore:Math.max(e.bestScore,r),inputIndex:i,lastInputCell:t,lastInputStatus:`correct`},result:a?`roundComplete`:`correct`}}function k(e,t,n){return{...e,phase:`showing`,round:t,plotEmojis:le(n),sequence:ce(t,n),inputIndex:0,lastInputCell:null,lastInputStatus:null}}function A(e,t){return Math.max(0,Math.min(e-1,Math.floor(t()*e)))}var j=`farm-paws-best-score-v1`;function M(){try{let e=window.localStorage.getItem(j),t=Number.parseInt(e||`0`,10);return Number.isFinite(t)?Math.max(0,t):0}catch{return 0}}function N(e){try{window.localStorage.setItem(j,String(Math.max(0,Math.floor(e))))}catch{}}var P=fe(),F={phase:`idle`,round:1,score:0,bestScore:M(),hp:3,maxHp:3,plotEmojis:T(),sequence:[],inputIndex:0,lastInputCell:null,lastInputStatus:null},I=null,L=0,R={mode:`local`,runId:null,bestScore:F.bestScore,error:null,petName:null,petType:null},z=0,B=!1,V=!1,H=null,U=null,W=null;de(),G();function de(){let e=window.Telegram?.WebApp;if(e)try{e.ready?.(),e.expand?.(),e.setHeaderColor?.(`#fff8df`),e.setBackgroundColor?.(`#fff8df`),e.disableVerticalSwipes?.()}catch{}}function fe(){let e=document.querySelector(`#app`);if(!e)throw Error(`App root was not found.`);return e}function G(){P.innerHTML=`
    <main class="phone-shell">
      <section class="game-card ${F.phase===`failed`?`is-failed`:``}">
        ${F.phase===`idle`?pe():me()}
      </section>
    </main>
  `,P.querySelector(`[data-action='start']`)?.addEventListener(`click`,K),P.querySelector(`[data-action='retry']`)?.addEventListener(`click`,K),P.querySelector(`[data-action='home']`)?.addEventListener(`click`,Te),P.querySelectorAll(`[data-cell]`).forEach(e=>{e.addEventListener(`click`,()=>{ve(Number.parseInt(e.dataset.cell||`-1`,10))})})}function pe(){return`
    <div class="start-screen">
      <div class="pet-badge" aria-hidden="true">🐾</div>
      <p class="eyebrow">Прогулка питомца</p>
      <h1>Фермерские лапки</h1>
      <p class="lead">Запомни маршрут питомца по грядкам и повтори его.</p>
      <div class="preview-grid" aria-hidden="true">
        ${Array.from({length:9},(e,t)=>`<span class="preview-plot">${De(t)}</span>`).join(``)}
      </div>
      <div class="mini-sequence" aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
      <button class="primary-button" data-action="start" ${B?`disabled`:``}>${B?`⏳ Стартуем`:`▶️ Играть`}</button>
      ${W?`<p class="start-warning">${Q(W)}</p>`:``}
      <p class="best-note">Лучший результат: <strong>${F.bestScore}</strong></p>
    </div>
  `}function me(){let e=F.phase===`failed`;return`
    <header class="top-panel">
      <div>
        <p class="eyebrow">🐾 Фермерские лапки</p>
        <h1>${e?`Забег окончен`:`Раунд ${F.round}`}</h1>
      </div>
      <div class="score-pill">
        <span>${F.score}</span>
        <small>урожай</small>
      </div>
    </header>

    <section class="stats-row" aria-label="Статистика забега">
      <span>Раунд: <strong>${F.round}</strong></span>
      <span>Рекорд: <strong>${F.bestScore}</strong></span>
    </section>
    <section class="heart-row" aria-label="Жизни">
      <span>${Q(R.petName||`Питомец`)}</span>
      <strong>${xe()}</strong>
    </section>

    ${e?ge():he()}
  `}function he(){return`
    <div class="status-line ${J()}">${be()}</div>
    <div class="farm-grid" aria-label="Грядки">
      ${Array.from({length:9},(e,t)=>_e(t)).join(``)}
    </div>
    <div class="cat-guide-panel" aria-label="Питомец помогает запомнить маршрут">
      <img class="cat-guide-image ${we()}" src="${X(!1)}" alt="" />
    </div>
  `}function ge(){return`
    <div class="result-panel">
      <img class="result-cat-image ${Y()}" src="${X(!0)}" alt="" />
      <h2>Урожай спасён: ${F.score}</h2>
      <p>Сердечки закончились.</p>
      <p>Лучший результат: <strong>${F.bestScore}</strong></p>
      <p class="reward-line">${Se()}</p>
      <div class="result-actions">
        <button class="primary-button" data-action="retry">🔁 Ещё раз</button>
        <button class="secondary-button" data-action="home">🏠 В дом</button>
      </div>
    </div>
  `}function _e(e){let t=I?.cellIndex===e,n=F.lastInputStatus===`correct`&&F.lastInputCell===e,r=F.lastInputStatus===`wrong`&&F.lastInputCell===e,i=F.plotEmojis[e]||`🌱`;return`
    <button class="${[`plot-button`,t?`is-active`:``,n?`is-correct`:``,r?`is-wrong`:``].filter(Boolean).join(` `)}" data-cell="${e}" ${F.phase===`input`?``:`disabled`} aria-label="Грядка ${e+1}">
      <span class="plot-content">${i}</span>
      ${t?`<span class="plot-pet" aria-hidden="true">🐕</span>`:``}
    </button>
  `}async function K(){if(B)return;L+=1;let e=L,t=M();I=null,V=!1,H=null,U=null,W=null,B=!0,F={...F,phase:`idle`,bestScore:Math.max(F.bestScore,t)},G();let n=await ee(t);if(e===L){if(B=!1,n.mode===`blocked`){R=n,W=Ee(n),F={...F,phase:`idle`,bestScore:Math.max(F.bestScore,n.bestScore)},G(),Z(W);return}R=n,z=Date.now(),F=ue(n.bestScore),G(),n.mode===`local`&&n.error&&Z(`Игра запущена локально. Награда не начислится.`),q(e)}}async function q(e){let t=oe(F.round),n=Math.max(110,Math.floor(t*.28));for(let[r,i]of F.sequence.entries()){if(e!==L||(I={cellIndex:i.cellIndex,stepNumber:r+1,totalSteps:F.sequence.length},G(),await $(t),e!==L))return;I=null,G(),await $(n)}e===L&&(F=D(F),G())}function ve(e){let t=L,n=O(F,e);F=n.state,I=null,F.bestScore>=F.score&&N(F.bestScore),G(),n.result===`mistake`&&window.setTimeout(()=>{t!==L||F.phase!==`input`||F.lastInputStatus!==`wrong`||(F={...F,lastInputCell:null,lastInputStatus:null},G())},520),n.result===`failed`&&ye(t),n.result===`roundComplete`&&window.setTimeout(()=>{t===L&&(F=E(F),G(),q(t))},700)}async function ye(e){if(V||H)return;V=!0,U=null,G();let t=await o(R,{score:F.score,round:F.round,hpLeft:F.hp,durationMs:Math.max(0,Date.now()-z)});e===L&&(V=!1,H=t,U=t.ok?null:t.error||`finish_failed`,typeof t.bestScore==`number`&&t.bestScore>F.bestScore&&(F={...F,bestScore:t.bestScore},N(t.bestScore)),G())}function be(){return F.phase===`showing`?`Смотри ${I?.stepNumber||1}/${I?.totalSteps||F.sequence.length}`:F.phase===`success`?`Верно`:F.phase===`failed`?`Ошибка`:F.lastInputStatus===`wrong`?`Минус сердце ${F.hp}/${F.maxHp}`:`Повтори ${Math.min(F.inputIndex+1,F.sequence.length)}/${F.sequence.length}`}function J(){return F.phase===`showing`?`is-watch`:F.phase===`success`?`is-success`:F.phase===`failed`||F.lastInputStatus===`wrong`?`is-error`:`is-repeat`}function xe(){return Array.from({length:F.maxHp},(e,t)=>t<F.hp?`❤️`:`🤍`).join(``)}function Se(){return V||R.mode===`server`&&!H&&!U?`Сохраняем результат...`:H?.mode===`server`&&H.ok?`Питомец получил +${H.xpReward||0} XP`:R.mode===`server`&&U?`Результат не сохранён, награда не начислена`:R.mode===`local`?`Локальный режим: награда не начисляется`:`Питомец получил +${se(F.score)} XP`}function Ce(){return F.phase===`showing`?`is-pointing`:F.phase===`success`?`is-happy`:F.lastInputStatus===`wrong`?`is-hurt`:`is-waiting`}function we(){return`${Ce()} ${Y()}`}function Y(){return R.petType===`dog`?`is-dog`:`is-cat`}function X(i=!1){let a=i||F.lastInputStatus===`wrong`;return R.petType===`dog`?a?r:n:a?t:e}function Z(e){let t=document.createElement(`div`);t.className=`toast`,t.textContent=e,document.body.append(t),window.setTimeout(()=>t.remove(),1800)}function Te(){try{let e=window.Telegram?.WebApp?.close;if(typeof e==`function`){e();return}}catch{}Z(`Закрой мини-игру, чтобы вернуться домой.`)}function Ee(e){if(e.code===`daily_limit`){let t=typeof e.dailyLimit==`number`?e.dailyLimit:null,n=typeof e.dailyStarts==`number`?e.dailyStarts:t;return`Лимит прогулок на сегодня исчерпан${t?` (${Math.min(n||0,t)}/${t})`:``}. Новые попытки будут в 00:00 UTC.`}return e.code===`no_pet`?`Сначала нужен питомец. Открой меню питомца в боте.`:e.code===`pet_dead`?`Питомец не может гулять. Открой меню питомца в боте.`:e.code===`pet_changed`?`Питомец изменился. Закрой мини-игру и открой прогулку заново из бота.`:e.code===`not_enough_energy`?`Не хватает энергии для прогулки.`:`Сейчас прогулку начать нельзя. Открой меню питомца и попробуй позже.`}function Q(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function $(e){return new Promise(t=>window.setTimeout(t,e))}function De(e){return T()[e]||`🌱`}