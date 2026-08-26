(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=null;async function t(t=globalThis){let r=t.AudioContext??t.webkitAudioContext;if(r)try{let t=e??new r;e=t,t.state===`suspended`&&await t.resume();let i=t.currentTime;n(t,i,104,.7),n(t,i+.07,73,.52),n(t,i+.15,128,.38)}catch{}}function n(e,t,n,r){let i=e.createOscillator(),a=e.createGain();i.type=`square`,i.frequency.setValueAtTime(n,t),i.frequency.exponentialRampToValueAtTime(Math.max(35,n*.42),t+.055),a.gain.setValueAtTime(1e-4,t),a.gain.exponentialRampToValueAtTime(Math.max(.001,r*.07),t+.004),a.gain.exponentialRampToValueAtTime(1e-4,t+.07),i.connect(a),a.connect(e.destination),i.start(t),i.stop(t+.075)}var r=252,i=1024;function a(e,t=5){let n=typeof e==`number`?e:Number(e);return Number.isFinite(n)?Math.min(100,Math.max(1,Math.trunc(n))):a(t,5)}function o(e){return e===2||e===3||e===4||e===5||e===6}function s(e){return Number.isInteger(e)&&Number(e)>=1&&Number(e)<=6}function c(e,t=f){let n=a(e),o=[],s=0;for(;o.length<n;){if(s>=i)throw Error(`The random source did not yield usable bytes.`);s+=1;let e=n-o.length,a=new Uint8Array(Math.max(16,Math.min(256,e*2)));t(a);for(let e of a)if(!(e>=r)&&(o.push(e%6+1),o.length===n))break}return Object.freeze(o)}function l(e){let t=[0,0,0,0,0,0];for(let n of e)t[n-1]+=1;return Object.freeze(t)}function u(e,t){return e.reduce((e,n)=>e+ +(n>=t),0)}function d(e){return e===6?`6 only`:`${e}+`}function f(e){if(!globalThis.crypto?.getRandomValues)throw Error(`Secure random generation is unavailable in this browser.`);globalThis.crypto.getRandomValues(e)}var p=`brodice.roll-history.v1`;function m(e,t,n=Date.now()){if(e.length<1||e.length>100||!e.every(s))throw Error(`A roll must contain between 1 and 100 valid d6 results.`);if(!o(t))throw Error(`Invalid success target.`);if(!Number.isSafeInteger(n)||n<=0)throw Error(`Invalid roll timestamp.`);let r=Object.freeze([...e]);return Object.freeze({version:1,id:`${n.toString(36)}-${re(r)}`,createdAt:n,target:t,faces:r})}function h(e){if(!e)return Object.freeze([]);try{let t=e.getItem(p);if(!t)return Object.freeze([]);let n=JSON.parse(t);if(!Array.isArray(n))return Object.freeze([]);let r=n.map(g).filter(e=>e!==null).sort((e,t)=>t.createdAt-e.createdAt).slice(0,20);return Object.freeze(r)}catch{return Object.freeze([])}}function ee(e,t,n=h(e)){let r=Object.freeze([t,...n.filter(e=>e.id!==t.id)].slice(0,20));return ne(e,r),r}function te(e){if(!e)return!1;try{return e.removeItem(p),!0}catch{return!1}}function ne(e,t){if(!e)return!1;try{return e.setItem(p,JSON.stringify(t.slice(0,20))),!0}catch{return!1}}function g(e){if(!e||typeof e!=`object`)return null;let t=e;if(t.version!==1||!Array.isArray(t.faces)||!o(t.target)||!Number.isSafeInteger(t.createdAt)||Number(t.createdAt)<=0||t.faces.length<1||t.faces.length>100||!t.faces.every(s))return null;try{return m(t.faces,t.target,Number(t.createdAt))}catch{return null}}function re(e){let t=2166136261;for(let n of e)t^=n,t=Math.imul(t,16777619);return(t>>>0).toString(36)}var _=`brodice.preferences.v1`,v=Object.freeze({diceCount:5,target:5,soundEnabled:!0});function y(e){if(!e)return v;try{let t=e.getItem(_);if(!t)return v;let n=JSON.parse(t);if(!n||typeof n!=`object`)return v;let r=n;return Object.freeze({diceCount:a(r.diceCount,5),target:o(r.target)?r.target:5,soundEnabled:typeof r.soundEnabled==`boolean`?r.soundEnabled:!0})}catch{return v}}function ie(e,t){if(!e)return!1;try{return e.setItem(_,JSON.stringify(t)),!0}catch{return!1}}var b=`roll`,x=`1`;function ae(e,t,n){let r=w(e);if(!r)return``;r.search=``,r.hash=``;let i=[x,t.createdAt.toString(36),String(n),t.faces.join(``)].join(`.`);return r.searchParams.set(b,i),r.toString()}function oe(e){let t=w(e);if(!t)return null;let n=t.searchParams.get(b);if(!n)return null;let[r,i,a,c,...l]=n.split(`.`);if(l.length>0||r!==x||!c)return null;let u=Number.parseInt(i??``,36),d=Number(a),f=[...c].map(Number);if(!Number.isSafeInteger(u)||u<=0||!o(d)||f.length<1||f.length>100||!f.every(s))return null;try{return m(f,d,u)}catch{return null}}function se(e,t){let n=l(e.faces),r=u(e.faces,t),i=n.map((e,t)=>`${t+1}: ${e}`).join(` · `);return[`🎲 BroDice · ${e.faces.length}d6`,i,`${d(t)} successes: ${r}`].join(`
`)}async function S(e,t){let n=C(e.url);try{if(t.telegramShare?.(e.text,n)===!0)return`telegram`}catch{}if(t.nativeShare)try{return await t.nativeShare({...e,url:n}),`native`}catch(e){if(ce(e))return`cancelled`}if(t.writeClipboard)try{return await t.writeClipboard([e.text,n].filter(Boolean).join(`
`)),`clipboard`}catch{}return`failed`}function C(e){let t=w(e);if(!t)return``;let n=t.searchParams.get(b);return t.search=``,t.hash=``,n&&t.searchParams.set(b,n.slice(0,180)),t.toString()}function w(e){try{let t=new URL(e);return t.protocol===`http:`||t.protocol===`https:`?t:null}catch{return null}}function ce(e){return typeof e==`object`&&!!e&&`name`in e&&e.name===`AbortError`}function le(e=window,t=document.documentElement.style){let n=e.Telegram?.WebApp,r=!1,i=()=>{let r=E(n?.viewportHeight)??e.innerHeight,i=E(n?.viewportStableHeight)??r;t.setProperty(`--tg-viewport-height`,`${Math.round(r)}px`),t.setProperty(`--tg-viewport-stable-height`,`${Math.round(i)}px`)},a=()=>{let e=n?.contentSafeAreaInset??n?.safeAreaInset;t.setProperty(`--tg-safe-top`,`${D(e?.top)}px`),t.setProperty(`--tg-safe-right`,`${D(e?.right)}px`),t.setProperty(`--tg-safe-bottom`,`${D(e?.bottom)}px`),t.setProperty(`--tg-safe-left`,`${D(e?.left)}px`)},o=e=>{try{e?.onEvent?.(`viewportChanged`,i)}catch{}try{e?.onEvent?.(`safeAreaChanged`,a)}catch{}try{e?.onEvent?.(`contentSafeAreaChanged`,a)}catch{}},s=e=>{try{e?.offEvent?.(`viewportChanged`,i)}catch{}try{e?.offEvent?.(`safeAreaChanged`,a)}catch{}try{e?.offEvent?.(`contentSafeAreaChanged`,a)}catch{}},c=()=>{if(r)return;let t=e.Telegram?.WebApp;t!==n&&(s(n),n=t,o(n));try{n?.ready?.(),n?.expand?.(),T(n,`7.7`)&&n?.disableVerticalSwipes?.(),T(n,`6.1`)&&(n?.setHeaderColor?.(`#0d1011`),n?.setBackgroundColor?.(`#080a0b`))}catch{}i(),a()};return e.addEventListener(`resize`,i,{passive:!0}),o(n),c(),Object.freeze({get isTelegram(){return n!==void 0},ready:c,haptic:e=>{if(!(r||!T(n,`6.1`)))try{e===`success`||e===`error`?n?.HapticFeedback?.notificationOccurred?.(e):n?.HapticFeedback?.impactOccurred?.(e)}catch{}},share:(e,t)=>{if(r||!n?.openTelegramLink)return!1;try{return n.openTelegramLink(ue(e,t)),!0}catch{return!1}},destroy:()=>{r||(s(n),e.removeEventListener(`resize`,i),r=!0)}})}function ue(e,t){let n=new URLSearchParams;return t&&n.set(`url`,t),n.set(`text`,e.trim().slice(0,1024)),`https://t.me/share/url?${n.toString()}`}function T(e,t){try{return e?.isVersionAtLeast?.(t)===!0}catch{return!1}}function E(e){return typeof e==`number`&&Number.isFinite(e)&&e>0?e:null}function D(e){return typeof e==`number`&&Number.isFinite(e)&&e>=0?Math.round(e):0}var O=[`⚀`,`⚁`,`⚂`,`⚃`,`⚄`,`⚅`],de=[2,3,4,5,6],fe=[1,2,5,10,20,50,100],pe=560,k=document.querySelector(`#app`);if(!k)throw Error(`BroDice app root is missing.`);var A=k,j=Oe(),M=le(),N=y(j),P=N.diceCount,F=N.target,I=N.soundEnabled,L=h(j),R=oe(window.location.href),z=R?`shared`:`fresh`,B=!1,V=!1,H=!1,U=``,W=null,G=null;R?(P=R.faces.length,F=R.target):ke()&&($(),window.setTimeout(()=>Q(`This shared roll link is invalid.`),0));function K(){let e=R?l(R.faces):null,t=R?u(R.faces,F):null,n=z===`shared`&&R!==null;A.innerHTML=`
    <main class="app-shell ${B?`is-rolling`:``}">
      <header class="brand-bar">
        <div class="brand-mark" aria-hidden="true"><span>VI</span></div>
        <div class="brand-copy">
          <p class="eyebrow">TABLETOP DICE TERMINAL</p>
          <h1>Bro<span>Dice</span></h1>
        </div>
        <div class="header-actions">
          <button class="icon-button ${I?`active`:``}" type="button" data-action="toggle-sound" aria-label="${I?`Mute roll sound`:`Enable roll sound`}" title="${I?`Sound on`:`Sound off`}">
            <span aria-hidden="true">${I?`♫`:`♪̸`}</span>
          </button>
          <button class="icon-button" type="button" data-action="open-history" aria-label="Open roll history" title="Roll history">
            <span aria-hidden="true">≡</span>
            ${L.length>0?`<span class="history-badge">${L.length}</span>`:``}
          </button>
        </div>
      </header>

      ${n?q():me()}
      ${he(R,e,t,n)}

      <footer><span>BRODICE // CLIENT-ONLY ROLL</span><span>v0.1</span></footer>
    </main>
    ${V?ge():``}
    ${U?`<div class="toast" role="status">${U}</div>`:``}
  `,ve()}function me(){return`
    <section class="control-panel" aria-labelledby="roll-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">D6 ROLL PROTOCOL</p>
          <h2 id="roll-heading">Set your roll</h2>
        </div>
        <span class="status-light">SECURE LOCAL RNG</span>
      </div>

      <div class="field-group">
        <span class="field-label">NUMBER OF DICE</span>
        <div class="stepper">
          <button type="button" data-action="decrement" aria-label="Remove one die" ${B?`disabled`:``}>−</button>
          <label>
            <span class="sr-only">Number of dice</span>
            <input id="dice-count" inputmode="numeric" type="number" min="1" max="100" value="${P}" ${B?`disabled`:``} />
          </label>
          <button type="button" data-action="increment" aria-label="Add one die" ${B?`disabled`:``}>+</button>
        </div>
        <div class="presets" aria-label="Quick dice amounts">
          ${fe.map(e=>`
            <button class="${e===P?`active`:``}" type="button" data-count="${e}" ${B?`disabled`:``}>${e}</button>
          `).join(``)}
        </div>
      </div>

      <div class="field-group">
        <span class="field-label">SUCCESS TARGET</span>
        <div class="targets" role="group" aria-label="Minimum successful die result">
          ${de.map(e=>`
            <button class="${e===F?`active`:``}" type="button" data-target="${e}" aria-pressed="${e===F}" ${B?`disabled`:``}>
              ${e===6?`6`:`${e}+`}
            </button>
          `).join(``)}
        </div>
      </div>

      <button class="roll-button" type="button" data-action="roll" ${B?`disabled`:``}>
        <span class="roll-icon" aria-hidden="true">⚄</span>
        <span>${B?`ROLLING…`:`ROLL ${P}D6`}</span>
      </button>
    </section>
  `}function q(){return`
    <aside class="shared-banner">
      <span class="shared-icon" aria-hidden="true">!</span>
      <div>
        <strong>SHARED ROLL</strong>
        <p>Client generated · Not independently verified</p>
      </div>
    </aside>
  `}function he(e,t,n,r){return`
    <section class="results-panel ${e?`has-result`:``}" aria-live="polite" aria-busy="${B}">
      <div class="result-summary">
        <p class="eyebrow">${r?`SHARED ROLL`:z===`history`?`HISTORICAL ROLL`:`ROLL RESULT`}</p>
        ${B?`<div class="rolling-display" aria-label="Rolling dice"><span>⚀</span><span>⚂</span><span>⚄</span></div><p class="result-note">Randomizing ${P} dice…</p>`:n===null?`<p class="awaiting">AWAITING ROLL</p><p class="result-note">Choose your dice and engage the roller.</p>`:`<p class="success-count"><strong>${n}</strong> ${n===1?`SUCCESS`:`SUCCESSES`}</p>
               <p class="result-note">Target ${d(F)} · ${e?.faces.length??P} dice · ${Ae(e?.createdAt)}</p>`}
      </div>

      <div class="face-grid" aria-label="Counts for dice faces one through six">
        ${O.map((e,n)=>{let r=n+1;return`<article class="face-card ${r>=F?`qualifies`:``}">
            <span class="face-glyph" aria-hidden="true">${e}</span>
            <span class="face-label">FACE ${r}</span>
            <strong>${t&&!B?t[n]:`—`}</strong>
          </article>`}).join(``)}
      </div>

      ${e&&!B?`
        <details class="individual-results">
          <summary>Individual dice <span>${e.faces.length}</span></summary>
          <div class="dice-list" aria-label="Individual dice results">
            ${e.faces.map((e,t)=>`<span class="die-chip ${e>=F?`qualifies`:``}" title="Die ${t+1}: ${e}">${O[e-1]}<span class="sr-only">${e}</span></span>`).join(``)}
          </div>
        </details>
        <div class="result-actions">
          ${r?`<button class="primary-action" type="button" data-action="roll-own">ROLL YOUR OWN</button>`:`<button class="secondary-action" type="button" data-action="share">SHARE RESULT</button>`}
        </div>
      `:``}
    </section>
  `}function ge(){return`
    <div class="sheet-backdrop" data-action="dismiss-history">
      <section class="history-sheet" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <header class="sheet-header">
          <div>
            <p class="eyebrow">DEVICE STORAGE</p>
            <h2 id="history-title">Roll history</h2>
          </div>
          <button class="icon-button" type="button" data-action="close-history" aria-label="Close roll history">×</button>
        </header>

        ${L.length===0?`<div class="empty-history"><span aria-hidden="true">⚅</span><strong>NO ROLLS RECORDED</strong><p>Your latest 20 rolls will stay on this device.</p></div>`:`<div class="history-list">
              ${L.map(_e).join(``)}
            </div>
            <div class="history-clear">
              ${H?`<p>Erase all local roll history?</p>
                   <div><button class="danger-action" type="button" data-action="confirm-clear">ERASE</button><button class="secondary-action" type="button" data-action="cancel-clear">CANCEL</button></div>`:`<button class="text-action" type="button" data-action="request-clear">CLEAR HISTORY</button>`}
            </div>`}
      </section>
    </div>
  `}function _e(e){let t=l(e.faces),n=u(e.faces,e.target);return`
    <article class="history-item">
      <button class="history-main" type="button" data-history-open="${e.id}">
        <span class="history-success"><strong>${n}</strong><small>${d(e.target)}</small></span>
        <span class="history-copy">
          <strong>${e.faces.length}D6 · ${je(e.createdAt)}</strong>
          <small>${t.map((e,t)=>`${t+1}:${e}`).join(`  `)}</small>
        </span>
      </button>
      <button class="reroll-button" type="button" data-history-reroll="${e.id}" aria-label="Roll ${e.faces.length} dice again with target ${d(e.target)}">↻</button>
    </article>
  `}function ve(){A.querySelector(`[data-action="toggle-sound"]`)?.addEventListener(`click`,be),A.querySelector(`[data-action="open-history"]`)?.addEventListener(`click`,Ce),A.querySelector(`[data-action="decrement"]`)?.addEventListener(`click`,()=>J(P-1)),A.querySelector(`[data-action="increment"]`)?.addEventListener(`click`,()=>J(P+1)),A.querySelector(`#dice-count`)?.addEventListener(`change`,e=>{J(e.currentTarget.value)}),A.querySelector(`#dice-count`)?.addEventListener(`keydown`,e=>{e.key===`Enter`&&e.currentTarget.blur()}),A.querySelectorAll(`[data-count]`).forEach(e=>{e.addEventListener(`click`,()=>J(e.dataset.count))}),A.querySelectorAll(`[data-target]`).forEach(e=>{e.addEventListener(`click`,()=>ye(Number(e.dataset.target)))}),A.querySelector(`[data-action="roll"]`)?.addEventListener(`click`,Y),A.querySelector(`[data-action="share"]`)?.addEventListener(`click`,()=>void xe()),A.querySelector(`[data-action="roll-own"]`)?.addEventListener(`click`,Se),A.querySelector(`[data-action="close-history"]`)?.addEventListener(`click`,X),A.querySelector(`[data-action="dismiss-history"]`)?.addEventListener(`click`,e=>{e.target===e.currentTarget&&X()}),A.querySelector(`[data-action="request-clear"]`)?.addEventListener(`click`,()=>{H=!0,K()}),A.querySelector(`[data-action="cancel-clear"]`)?.addEventListener(`click`,()=>{H=!1,K()}),A.querySelector(`[data-action="confirm-clear"]`)?.addEventListener(`click`,Ee),A.querySelectorAll(`[data-history-open]`).forEach(e=>{e.addEventListener(`click`,()=>we(e.dataset.historyOpen))}),A.querySelectorAll(`[data-history-reroll]`).forEach(e=>{e.addEventListener(`click`,()=>Te(e.dataset.historyReroll))})}function J(e){B||z===`shared`||(P=a(e,N.diceCount),Z(),M.haptic(`light`),K())}function ye(e){B||z===`shared`||!o(e)||(F=e,Z(),M.haptic(`light`),K())}function be(){I=!I,Z(),M.haptic(`light`),I&&t(),K()}function Y(){B||z===`shared`||(B=!0,z=`fresh`,M.haptic(`medium`),M.isTelegram||Me(18),I&&t(),K(),W!==null&&window.clearTimeout(W),W=window.setTimeout(()=>{W=null;try{let e=m(c(P),F);R=e,L=ee(j,e,L),B=!1,M.haptic(`success`),K()}catch{B=!1,M.haptic(`error`),K(),Q(`Secure random generation is unavailable.`)}},pe))}async function xe(){if(!R||B||z===`shared`)return;let e=ae(window.location.href,R,F),t=await S({title:`BroDice roll`,text:se(R,F),url:e},{telegramShare:M.share,nativeShare:typeof navigator.share==`function`?e=>navigator.share(e):void 0,writeClipboard:De});t===`clipboard`?Q(`Result link copied.`):t===`failed`&&Q(`Could not share this roll.`)}function Se(){$(),R=null,z=`fresh`,N=y(j),P=N.diceCount,F=N.target,I=N.soundEnabled,M.haptic(`light`),K()}function Ce(){V=!0,H=!1,M.haptic(`light`),K(),window.setTimeout(()=>A.querySelector(`[data-action="close-history"]`)?.focus(),0)}function X(){V=!1,H=!1,K()}function we(e){let t=L.find(t=>t.id===e);t&&(R=t,z=`history`,P=t.faces.length,F=t.target,V=!1,H=!1,M.haptic(`light`),K())}function Te(e){let t=L.find(t=>t.id===e);t&&(P=t.faces.length,F=t.target,V=!1,H=!1,Z(),K(),Y())}function Ee(){te(j),L=Object.freeze([]),H=!1,M.haptic(`success`),K(),Q(`Roll history cleared.`)}function Z(){N=Object.freeze({diceCount:P,target:F,soundEnabled:I}),ie(j,N)}function Q(e){U=e.slice(0,160),G!==null&&window.clearTimeout(G),K(),G=window.setTimeout(()=>{U=``,G=null,K()},3e3)}async function De(e){if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(e);return}let t=document.createElement(`textarea`);t.value=e,t.style.position=`fixed`,t.style.opacity=`0`,document.body.append(t),t.select();let n=document.execCommand(`copy`);if(t.remove(),!n)throw Error(`Clipboard is unavailable.`)}function Oe(){try{return window.localStorage}catch{return null}}function ke(){try{return new URL(window.location.href).searchParams.has(`roll`)}catch{return!1}}function $(){try{let e=new URL(window.location.href);e.searchParams.delete(`roll`),e.hash=``,window.history.replaceState(null,``,e)}catch{}}function Ae(e){return e?new Intl.DateTimeFormat(`en`,{hour:`2-digit`,minute:`2-digit`}).format(e):`just now`}function je(e){return new Intl.DateTimeFormat(`en`,{month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`}).format(e)}function Me(e){try{navigator.vibrate?.(e)}catch{}}document.addEventListener(`keydown`,e=>{e.key===`Escape`&&V&&X()}),window.addEventListener(`beforeunload`,()=>{W!==null&&window.clearTimeout(W),G!==null&&window.clearTimeout(G),M.destroy()},{once:!0}),K();