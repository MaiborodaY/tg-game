(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=null,t=1e-4,n=.12,r=[{offset:0,duration:.042,cutoff:980,volume:.3},{offset:.047,duration:.035,cutoff:760,volume:.19},{offset:.092,duration:.044,cutoff:1140,volume:.24},{offset:.148,duration:.036,cutoff:880,volume:.15},{offset:.205,duration:.032,cutoff:680,volume:.1}];async function i(i=globalThis){let o=i.AudioContext??i.webkitAudioContext;if(o)try{let i=e??new o;e=i,i.state===`suspended`&&await i.resume();let s=i.currentTime,c=i.createGain();c.gain.setValueAtTime(t,s),c.gain.linearRampToValueAtTime(n,s+.008),c.gain.exponentialRampToValueAtTime(t,s+.28),c.connect(i.destination);for(let e of r)a(i,c,s+e.offset,e.duration,e.cutoff,e.volume)}catch{}}function a(e,n,r,i,a,s){let c=e.createBufferSource();c.buffer=o(e,i,Math.round(r*e.sampleRate)^a);let l=e.createBiquadFilter();l.type=`lowpass`,l.frequency.setValueAtTime(a,r),l.Q.setValueAtTime(.7,r);let u=e.createGain();u.gain.setValueAtTime(t,r),u.gain.linearRampToValueAtTime(s,r+.004),u.gain.exponentialRampToValueAtTime(t,r+i),c.connect(l),l.connect(u),u.connect(n),c.start(r),c.stop(r+i+.005)}function o(e,t,n){let r=Math.max(1,Math.round(e.sampleRate*t)),i=e.createBuffer(1,r,e.sampleRate),a=i.getChannelData(0),o=(n^r)>>>0;o===0&&(o=1831565813);for(let e=0;e<r;e+=1){o^=o<<13,o^=o>>>17,o^=o<<5;let t=e/r;a[e]=((o>>>0)/4294967295*2-1)*(1-t)**2}return i}var s=252,c=1024;function l(e,t=5){let n=typeof e==`number`?e:Number(e);return Number.isFinite(n)?Math.min(100,Math.max(1,Math.trunc(n))):l(t,5)}function u(e){return e===2||e===3||e===4||e===5||e===6}function d(e){return Number.isInteger(e)&&Number(e)>=1&&Number(e)<=6}function f(e,t=ee){let n=l(e),r=[],i=0;for(;r.length<n;){if(i>=c)throw Error(`The random source did not yield usable bytes.`);i+=1;let e=n-r.length,a=new Uint8Array(Math.max(16,Math.min(256,e*2)));t(a);for(let e of a)if(!(e>=s)&&(r.push(e%6+1),r.length===n))break}return Object.freeze(r)}function p(e){let t=[0,0,0,0,0,0];for(let n of e)t[n-1]+=1;return Object.freeze(t)}function m(e,t){return e.reduce((e,n)=>e+ +(n>=t),0)}function h(e){return e===6?`6 only`:`${e}+`}function ee(e){if(!globalThis.crypto?.getRandomValues)throw Error(`Secure random generation is unavailable in this browser.`);globalThis.crypto.getRandomValues(e)}var g=`brodice.roll-history.v1`;function _(e,t,n=Date.now()){if(e.length<1||e.length>100||!e.every(d))throw Error(`A roll must contain between 1 and 100 valid d6 results.`);if(!u(t))throw Error(`Invalid success target.`);if(!Number.isSafeInteger(n)||n<=0)throw Error(`Invalid roll timestamp.`);let r=Object.freeze([...e]);return Object.freeze({version:1,id:`${n.toString(36)}-${ae(r)}`,createdAt:n,target:t,faces:r})}function v(e){if(!e)return Object.freeze([]);try{let t=e.getItem(g);if(!t)return Object.freeze([]);let n=JSON.parse(t);if(!Array.isArray(n))return Object.freeze([]);let r=n.map(ie).filter(e=>e!==null).sort((e,t)=>t.createdAt-e.createdAt).slice(0,20);return Object.freeze(r)}catch{return Object.freeze([])}}function te(e,t,n=v(e)){let r=Object.freeze([t,...n.filter(e=>e.id!==t.id)].slice(0,20));return re(e,r),r}function ne(e){if(!e)return!1;try{return e.removeItem(g),!0}catch{return!1}}function re(e,t){if(!e)return!1;try{return e.setItem(g,JSON.stringify(t.slice(0,20))),!0}catch{return!1}}function ie(e){if(!e||typeof e!=`object`)return null;let t=e;if(t.version!==1||!Array.isArray(t.faces)||!u(t.target)||!Number.isSafeInteger(t.createdAt)||Number(t.createdAt)<=0||t.faces.length<1||t.faces.length>100||!t.faces.every(d))return null;try{return _(t.faces,t.target,Number(t.createdAt))}catch{return null}}function ae(e){let t=2166136261;for(let n of e)t^=n,t=Math.imul(t,16777619);return(t>>>0).toString(36)}var y=`brodice.preferences.v1`,b=Object.freeze({diceCount:5,target:5,soundEnabled:!0});function x(e){if(!e)return b;try{let t=e.getItem(y);if(!t)return b;let n=JSON.parse(t);if(!n||typeof n!=`object`)return b;let r=n;return Object.freeze({diceCount:l(r.diceCount,5),target:u(r.target)?r.target:5,soundEnabled:typeof r.soundEnabled==`boolean`?r.soundEnabled:!0})}catch{return b}}function oe(e,t){if(!e)return!1;try{return e.setItem(y,JSON.stringify(t)),!0}catch{return!1}}var S=`roll`,C=`1`;function se(e,t,n){let r=w(e);if(!r)return``;r.search=``,r.hash=``;let i=[C,t.createdAt.toString(36),String(n),t.faces.join(``)].join(`.`);return r.searchParams.set(S,i),r.toString()}function ce(e){let t=w(e);if(!t)return null;let n=t.searchParams.get(S);if(!n)return null;let[r,i,a,o,...s]=n.split(`.`);if(s.length>0||r!==C||!o)return null;let c=Number.parseInt(i??``,36),l=Number(a),f=[...o].map(Number);if(!Number.isSafeInteger(c)||c<=0||!u(l)||f.length<1||f.length>100||!f.every(d))return null;try{return _(f,l,c)}catch{return null}}function le(e,t){let n=p(e.faces),r=m(e.faces,t),i=n.map((e,t)=>`${t+1}: ${e}`).join(` · `);return[`🎲 BroDice · ${e.faces.length}d6`,i,`${h(t)} successes: ${r}`].join(`
`)}async function ue(e,t){let n=de(e.url);try{if(t.telegramShare?.(e.text,n)===!0)return`telegram`}catch{}if(t.nativeShare)try{return await t.nativeShare({...e,url:n}),`native`}catch(e){if(fe(e))return`cancelled`}if(t.writeClipboard)try{return await t.writeClipboard([e.text,n].filter(Boolean).join(`
`)),`clipboard`}catch{}return`failed`}function de(e){let t=w(e);if(!t)return``;let n=t.searchParams.get(S);return t.search=``,t.hash=``,n&&t.searchParams.set(S,n.slice(0,180)),t.toString()}function w(e){try{let t=new URL(e);return t.protocol===`http:`||t.protocol===`https:`?t:null}catch{return null}}function fe(e){return typeof e==`object`&&!!e&&`name`in e&&e.name===`AbortError`}function pe(e=window,t=document.documentElement.style){let n=e.Telegram?.WebApp,r=!1,i=()=>{let r=E(n?.viewportHeight)??e.innerHeight,i=E(n?.viewportStableHeight)??r;t.setProperty(`--tg-viewport-height`,`${Math.round(r)}px`),t.setProperty(`--tg-viewport-stable-height`,`${Math.round(i)}px`)},a=()=>{let e=n?.contentSafeAreaInset??n?.safeAreaInset;t.setProperty(`--tg-safe-top`,`${D(e?.top)}px`),t.setProperty(`--tg-safe-right`,`${D(e?.right)}px`),t.setProperty(`--tg-safe-bottom`,`${D(e?.bottom)}px`),t.setProperty(`--tg-safe-left`,`${D(e?.left)}px`)},o=e=>{try{e?.onEvent?.(`viewportChanged`,i)}catch{}try{e?.onEvent?.(`safeAreaChanged`,a)}catch{}try{e?.onEvent?.(`contentSafeAreaChanged`,a)}catch{}},s=e=>{try{e?.offEvent?.(`viewportChanged`,i)}catch{}try{e?.offEvent?.(`safeAreaChanged`,a)}catch{}try{e?.offEvent?.(`contentSafeAreaChanged`,a)}catch{}},c=()=>{if(r)return;let t=e.Telegram?.WebApp;t!==n&&(s(n),n=t,o(n));try{n?.ready?.(),n?.expand?.(),T(n,`7.7`)&&n?.disableVerticalSwipes?.(),T(n,`6.1`)&&(n?.setHeaderColor?.(`#0d1011`),n?.setBackgroundColor?.(`#080a0b`))}catch{}i(),a()};return e.addEventListener(`resize`,i,{passive:!0}),o(n),c(),Object.freeze({get isTelegram(){return n!==void 0},ready:c,haptic:e=>{if(!(r||!T(n,`6.1`)))try{e===`success`||e===`error`?n?.HapticFeedback?.notificationOccurred?.(e):n?.HapticFeedback?.impactOccurred?.(e)}catch{}},share:(e,t)=>{if(r||!n?.openTelegramLink)return!1;try{return n.openTelegramLink(me(e,t)),!0}catch{return!1}},destroy:()=>{r||(s(n),e.removeEventListener(`resize`,i),r=!0)}})}function me(e,t){let n=new URLSearchParams;return t&&n.set(`url`,t),n.set(`text`,e.trim().slice(0,1024)),`https://t.me/share/url?${n.toString()}`}function T(e,t){try{return e?.isVersionAtLeast?.(t)===!0}catch{return!1}}function E(e){return typeof e==`number`&&Number.isFinite(e)&&e>0?e:null}function D(e){return typeof e==`number`&&Number.isFinite(e)&&e>=0?Math.round(e):0}var O=[`⚀`,`⚁`,`⚂`,`⚃`,`⚄`,`⚅`],he=[2,3,4,5,6],ge=[3,10,20,50],_e=560,k=document.querySelector(`#app`);if(!k)throw Error(`BroDice app root is missing.`);var A=k,j=Ne(),M=pe(),N=x(j),P=N.diceCount,F=N.target,I=N.soundEnabled,L=v(j),R=ce(window.location.href),z=R?`shared`:`fresh`,B=!1,V=!1,H=!1,U=``,W=null,G=null;R?(P=R.faces.length,F=R.target):Pe()&&(Q(),window.setTimeout(()=>Z(`This shared roll link is invalid.`),0));function K(){let e=R?p(R.faces):null,t=R?m(R.faces,F):null,n=z===`shared`&&R!==null;A.innerHTML=`
    <main class="app-shell ${B?`is-rolling`:``}">
      <header class="brand-bar">
        <div class="brand-mark" aria-hidden="true">
          <svg class="dice-mark" viewBox="0 0 48 48">
            <path class="dice-mark-body" d="M13 7h22l6 6v22l-6 6H13l-6-6V13Z" />
            <circle cx="16" cy="15" r="2.8" />
            <circle cx="32" cy="15" r="2.8" />
            <circle cx="16" cy="24" r="2.8" />
            <circle cx="32" cy="24" r="2.8" />
            <circle cx="16" cy="33" r="2.8" />
            <circle cx="32" cy="33" r="2.8" />
          </svg>
        </div>
        <div class="brand-copy">
          <p class="eyebrow">TABLETOP D6 ROLLER</p>
          <h1>Bro<span>Dice</span></h1>
        </div>
        <div class="header-actions">
          <button class="icon-button ${I?`active`:``}" type="button" data-action="toggle-sound" aria-label="${I?`Mute roll sound`:`Enable roll sound`}" title="${I?`Sound on`:`Sound off`}">
            <span class="header-action-label" aria-hidden="true">${I?`SOUND`:`MUTED`}</span>
          </button>
          <button class="icon-button" type="button" data-action="open-history" aria-label="Open roll history" title="Roll history">
            <span class="header-action-label" aria-hidden="true">ROLLS</span>
            ${L.length>0?`<span class="history-badge">${L.length}</span>`:``}
          </button>
        </div>
      </header>

      ${n?ye():ve()}
      ${be(R,e,t,n)}

      <footer><span>LOCAL RNG · SAVED ON THIS DEVICE</span><span>v0.1</span></footer>
    </main>
    ${V?xe():``}
    ${U?`<div class="toast" role="status">${U}</div>`:``}
  `,Ce()}function ve(){return`
    <section class="control-panel" aria-labelledby="roll-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">NEW ROLL</p>
          <h2 id="roll-heading">Choose your dice</h2>
        </div>
        <span class="setup-hint">1–100 D6</span>
      </div>

      <div class="field-group">
        <div class="field-label-row">
          <span class="field-label">DICE COUNT</span>
          <span class="field-help">Tap or type</span>
        </div>
        <div class="stepper">
          <button type="button" data-action="decrement" aria-label="Remove one die" ${B?`disabled`:``}>−</button>
          <label>
            <span class="sr-only">Number of dice</span>
            <input id="dice-count" inputmode="numeric" type="number" min="1" max="100" value="${P}" ${B?`disabled`:``} />
          </label>
          <button type="button" data-action="increment" aria-label="Add one die" ${B?`disabled`:``}>+</button>
        </div>
        <div class="presets" aria-label="Quick dice amounts">
          ${ge.map(e=>`
            <button class="${e===P?`active`:``}" type="button" data-count="${e}" ${B?`disabled`:``}>${e}</button>
          `).join(``)}
        </div>
      </div>

      <div class="field-group">
        <div class="field-label-row">
          <span class="field-label">SUCCESS ON</span>
          <span class="field-help">${Le(F)}</span>
        </div>
        <div class="targets" role="group" aria-label="Minimum successful die result">
          ${he.map(e=>`
            <button class="${e===F?`active`:``}" type="button" data-target="${e}" aria-pressed="${e===F}" ${B?`disabled`:``}>
              ${h(e)}
            </button>
          `).join(``)}
        </div>
      </div>

      <button class="roll-button" type="button" data-action="roll" ${B?`disabled`:``}>
        <span class="roll-icon" aria-hidden="true">⚄</span>
        <span>${B?`ROLLING…`:`ROLL ${P} ${P===1?`DIE`:`DICE`}`}</span>
      </button>
    </section>
  `}function ye(){return`
    <aside class="shared-banner">
      <span class="shared-icon" aria-hidden="true">!</span>
      <div>
        <strong>SHARED ROLL</strong>
        <p>Client generated · Not independently verified</p>
      </div>
    </aside>
  `}function be(e,t,n,r){return!e&&!B?`
      <section class="results-panel results-empty" aria-live="polite">
        <div class="empty-result-copy">
          <span class="empty-result-die" aria-hidden="true">⚄</span>
          <div>
            <p class="eyebrow">ROLL RESULT</p>
            <p class="awaiting">Ready to roll</p>
            <p class="result-note">Face counts and ${h(F)} successes will appear here.</p>
          </div>
        </div>
      </section>
    `:B?`
      <section class="results-panel results-rolling" aria-live="polite" aria-busy="true">
        <div class="result-summary">
          <p class="eyebrow">ROLLING ${P} DICE</p>
          <div class="rolling-display" aria-label="Rolling dice"><span>⚀</span><span>⚂</span><span>⚄</span></div>
          <p class="result-note">Generating a secure local result…</p>
        </div>
      </section>
    `:`
    <section class="results-panel has-result" aria-live="polite" aria-busy="false">
      <div class="result-summary">
        <div class="result-context">
          <p class="eyebrow">${r?`SHARED ROLL`:z===`history`?`HISTORICAL ROLL`:`ROLL RESULT`}</p>
          <p class="result-note">${e?.faces.length??P} dice · ${Fe(e?.createdAt)}</p>
        </div>
        <p class="success-count">
          <strong>${n}</strong>
          <span>${n===1?`SUCCESS`:`SUCCESSES`}<small>AT ${h(F)}</small></span>
        </p>
      </div>

      <div class="face-grid" aria-label="Counts for dice faces one through six">
        ${O.map((e,n)=>{let r=n+1;return`<article class="face-card ${r>=F?`qualifies`:``}" aria-label="Face ${r}: ${t?.[n]??0}">
            <span class="face-label">FACE ${r}</span>
            <span class="face-glyph" aria-hidden="true">${e}</span>
            <strong>${t?.[n]??0}</strong>
          </article>`}).join(``)}
      </div>

      ${e?`
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
  `}function xe(){return`
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
              ${L.map(Se).join(``)}
            </div>
            <div class="history-clear">
              ${H?`<p>Erase all local roll history?</p>
                   <div><button class="danger-action" type="button" data-action="confirm-clear">ERASE</button><button class="secondary-action" type="button" data-action="cancel-clear">CANCEL</button></div>`:`<button class="text-action" type="button" data-action="request-clear">CLEAR HISTORY</button>`}
            </div>`}
      </section>
    </div>
  `}function Se(e){let t=p(e.faces),n=m(e.faces,e.target);return`
    <article class="history-item">
      <button class="history-main" type="button" data-history-open="${e.id}">
        <span class="history-success"><strong>${n}</strong><small>${h(e.target)}</small></span>
        <span class="history-copy">
          <strong>${e.faces.length}D6 · ${Ie(e.createdAt)}</strong>
          <small>${t.map((e,t)=>`${t+1}:${e}`).join(`  `)}</small>
        </span>
      </button>
      <button class="reroll-button" type="button" data-history-reroll="${e.id}" aria-label="Roll ${e.faces.length} dice again with target ${h(e.target)}">↻</button>
    </article>
  `}function Ce(){A.querySelector(`[data-action="toggle-sound"]`)?.addEventListener(`click`,Te),A.querySelector(`[data-action="open-history"]`)?.addEventListener(`click`,Oe),A.querySelector(`[data-action="decrement"]`)?.addEventListener(`click`,()=>q(P-1)),A.querySelector(`[data-action="increment"]`)?.addEventListener(`click`,()=>q(P+1)),A.querySelector(`#dice-count`)?.addEventListener(`change`,e=>{q(e.currentTarget.value)}),A.querySelector(`#dice-count`)?.addEventListener(`keydown`,e=>{e.key===`Enter`&&e.currentTarget.blur()}),A.querySelectorAll(`[data-count]`).forEach(e=>{e.addEventListener(`click`,()=>q(e.dataset.count))}),A.querySelectorAll(`[data-target]`).forEach(e=>{e.addEventListener(`click`,()=>we(Number(e.dataset.target)))}),A.querySelector(`[data-action="roll"]`)?.addEventListener(`click`,J),A.querySelector(`[data-action="share"]`)?.addEventListener(`click`,()=>void Ee()),A.querySelector(`[data-action="roll-own"]`)?.addEventListener(`click`,De),A.querySelector(`[data-action="close-history"]`)?.addEventListener(`click`,Y),A.querySelector(`[data-action="dismiss-history"]`)?.addEventListener(`click`,e=>{e.target===e.currentTarget&&Y()}),A.querySelector(`[data-action="request-clear"]`)?.addEventListener(`click`,()=>{H=!0,K()}),A.querySelector(`[data-action="cancel-clear"]`)?.addEventListener(`click`,()=>{H=!1,K()}),A.querySelector(`[data-action="confirm-clear"]`)?.addEventListener(`click`,je),A.querySelectorAll(`[data-history-open]`).forEach(e=>{e.addEventListener(`click`,()=>ke(e.dataset.historyOpen))}),A.querySelectorAll(`[data-history-reroll]`).forEach(e=>{e.addEventListener(`click`,()=>Ae(e.dataset.historyReroll))})}function q(e){B||z===`shared`||(P=l(e,N.diceCount),X(),M.haptic(`light`),K())}function we(e){B||z===`shared`||!u(e)||(F=e,X(),M.haptic(`light`),K())}function Te(){I=!I,X(),M.haptic(`light`),K()}function J(){B||z===`shared`||(B=!0,z=`fresh`,M.haptic(`medium`),M.isTelegram||Re(18),I&&i(),K(),W!==null&&window.clearTimeout(W),W=window.setTimeout(()=>{W=null;try{let e=_(f(P),F);R=e,L=te(j,e,L),B=!1,M.haptic(`success`),K(),$()}catch{B=!1,M.haptic(`error`),K(),Z(`Secure random generation is unavailable.`)}},_e))}async function Ee(){if(!R||B||z===`shared`)return;let e=se(window.location.href,R,F),t=await ue({title:`BroDice roll`,text:le(R,F),url:e},{telegramShare:M.share,nativeShare:typeof navigator.share==`function`?e=>navigator.share(e):void 0,writeClipboard:Me});t===`clipboard`?Z(`Result link copied.`):t===`failed`&&Z(`Could not share this roll.`)}function De(){Q(),R=null,z=`fresh`,N=x(j),P=N.diceCount,F=N.target,I=N.soundEnabled,M.haptic(`light`),K()}function Oe(){V=!0,H=!1,M.haptic(`light`),K(),window.setTimeout(()=>A.querySelector(`[data-action="close-history"]`)?.focus(),0)}function Y(){V=!1,H=!1,K()}function ke(e){let t=L.find(t=>t.id===e);t&&(R=t,z=`history`,P=t.faces.length,F=t.target,V=!1,H=!1,M.haptic(`light`),K(),$())}function Ae(e){let t=L.find(t=>t.id===e);t&&(P=t.faces.length,F=t.target,V=!1,H=!1,X(),K(),J())}function je(){ne(j),L=Object.freeze([]),H=!1,M.haptic(`success`),K(),Z(`Roll history cleared.`)}function X(){N=Object.freeze({diceCount:P,target:F,soundEnabled:I}),oe(j,N)}function Z(e){U=e.slice(0,160),G!==null&&window.clearTimeout(G),K(),G=window.setTimeout(()=>{U=``,G=null,K()},3e3)}async function Me(e){if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(e);return}let t=document.createElement(`textarea`);t.value=e,t.style.position=`fixed`,t.style.opacity=`0`,document.body.append(t),t.select();let n=document.execCommand(`copy`);if(t.remove(),!n)throw Error(`Clipboard is unavailable.`)}function Ne(){try{return window.localStorage}catch{return null}}function Pe(){try{return new URL(window.location.href).searchParams.has(`roll`)}catch{return!1}}function Q(){try{let e=new URL(window.location.href);e.searchParams.delete(`roll`),e.hash=``,window.history.replaceState(null,``,e)}catch{}}function Fe(e){return e?new Intl.DateTimeFormat(`en`,{hour:`2-digit`,minute:`2-digit`}).format(e):`just now`}function Ie(e){return new Intl.DateTimeFormat(`en`,{month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`}).format(e)}function Le(e){return e===6?`Only 6s count`:`${e}–6 count`}function $(){window.setTimeout(()=>{let e=A.querySelector(`.results-panel.has-result`);if(!e)return;let t=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches??!1;e.scrollIntoView({behavior:t?`auto`:`smooth`,block:`start`})},0)}function Re(e){try{navigator.vibrate?.(e)}catch{}}document.addEventListener(`keydown`,e=>{e.key===`Escape`&&V&&Y()}),window.addEventListener(`beforeunload`,()=>{W!==null&&window.clearTimeout(W),G!==null&&window.clearTimeout(G),M.destroy()},{once:!0}),K();