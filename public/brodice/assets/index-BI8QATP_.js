(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=null,t=1e-4,n=.12,r=[{offset:0,duration:.042,cutoff:980,volume:.3},{offset:.047,duration:.035,cutoff:760,volume:.19},{offset:.092,duration:.044,cutoff:1140,volume:.24},{offset:.148,duration:.036,cutoff:880,volume:.15},{offset:.205,duration:.032,cutoff:680,volume:.1}];async function i(i=globalThis){let o=i.AudioContext??i.webkitAudioContext;if(o)try{let i=e??new o;e=i,i.state===`suspended`&&await i.resume();let s=i.currentTime,c=i.createGain();c.gain.setValueAtTime(t,s),c.gain.linearRampToValueAtTime(n,s+.008),c.gain.exponentialRampToValueAtTime(t,s+.28),c.connect(i.destination);for(let e of r)a(i,c,s+e.offset,e.duration,e.cutoff,e.volume)}catch{}}function a(e,n,r,i,a,s){let c=e.createBufferSource();c.buffer=o(e,i,Math.round(r*e.sampleRate)^a);let l=e.createBiquadFilter();l.type=`lowpass`,l.frequency.setValueAtTime(a,r),l.Q.setValueAtTime(.7,r);let u=e.createGain();u.gain.setValueAtTime(t,r),u.gain.linearRampToValueAtTime(s,r+.004),u.gain.exponentialRampToValueAtTime(t,r+i),c.connect(l),l.connect(u),u.connect(n),c.start(r),c.stop(r+i+.005)}function o(e,t,n){let r=Math.max(1,Math.round(e.sampleRate*t)),i=e.createBuffer(1,r,e.sampleRate),a=i.getChannelData(0),o=(n^r)>>>0;o===0&&(o=1831565813);for(let e=0;e<r;e+=1){o^=o<<13,o^=o>>>17,o^=o<<5;let t=e/r;a[e]=((o>>>0)/4294967295*2-1)*(1-t)**2}return i}var s=252,c=1024;function l(e,t=5){let n=typeof e==`number`?e:Number(e);return Number.isFinite(n)?Math.min(100,Math.max(1,Math.trunc(n))):l(t,5)}function u(e){return e===2||e===3||e===4||e===5||e===6}function d(e){return Number.isInteger(e)&&Number(e)>=1&&Number(e)<=6}function f(e,t=ee){let n=l(e),r=[],i=0;for(;r.length<n;){if(i>=c)throw Error(`The random source did not yield usable bytes.`);i+=1;let e=n-r.length,a=new Uint8Array(Math.max(16,Math.min(256,e*2)));t(a);for(let e of a)if(!(e>=s)&&(r.push(e%6+1),r.length===n))break}return Object.freeze(r)}function p(e){let t=[0,0,0,0,0,0];for(let n of e)t[n-1]+=1;return Object.freeze(t)}function m(e,t){return e.reduce((e,n)=>e+ +(n>=t),0)}function h(e){return e===6?`6 only`:`${e}+`}function ee(e){if(!globalThis.crypto?.getRandomValues)throw Error(`Secure random generation is unavailable in this browser.`);globalThis.crypto.getRandomValues(e)}var g=`brodice.roll-history.v1`;function _(e,t,n=Date.now()){if(e.length<1||e.length>100||!e.every(d))throw Error(`A roll must contain between 1 and 100 valid d6 results.`);if(!u(t))throw Error(`Invalid success target.`);if(!Number.isSafeInteger(n)||n<=0)throw Error(`Invalid roll timestamp.`);let r=Object.freeze([...e]);return Object.freeze({version:1,id:`${n.toString(36)}-${ae(r)}`,createdAt:n,target:t,faces:r})}function v(e){if(!e)return Object.freeze([]);try{let t=e.getItem(g);if(!t)return Object.freeze([]);let n=JSON.parse(t);if(!Array.isArray(n))return Object.freeze([]);let r=n.map(ie).filter(e=>e!==null).sort((e,t)=>t.createdAt-e.createdAt).slice(0,20);return Object.freeze(r)}catch{return Object.freeze([])}}function te(e,t,n=v(e)){let r=Object.freeze([t,...n.filter(e=>e.id!==t.id)].slice(0,20));return re(e,r),r}function ne(e){if(!e)return!1;try{return e.removeItem(g),!0}catch{return!1}}function re(e,t){if(!e)return!1;try{return e.setItem(g,JSON.stringify(t.slice(0,20))),!0}catch{return!1}}function ie(e){if(!e||typeof e!=`object`)return null;let t=e;if(t.version!==1||!Array.isArray(t.faces)||!u(t.target)||!Number.isSafeInteger(t.createdAt)||Number(t.createdAt)<=0||t.faces.length<1||t.faces.length>100||!t.faces.every(d))return null;try{return _(t.faces,t.target,Number(t.createdAt))}catch{return null}}function ae(e){let t=2166136261;for(let n of e)t^=n,t=Math.imul(t,16777619);return(t>>>0).toString(36)}var oe=`brodice.preferences.v1`,y=Object.freeze({diceCount:5,target:5,soundEnabled:!0});function b(e){if(!e)return y;try{let t=e.getItem(oe);if(!t)return y;let n=JSON.parse(t);if(!n||typeof n!=`object`)return y;let r=n;return Object.freeze({diceCount:l(r.diceCount,5),target:u(r.target)?r.target:5,soundEnabled:typeof r.soundEnabled==`boolean`?r.soundEnabled:!0})}catch{return y}}function se(e,t){if(!e)return!1;try{return e.setItem(oe,JSON.stringify(t)),!0}catch{return!1}}var x=`roll`,S=`startapp`,ce=`tgWebAppStartParam`,C=`1`,w=`r${C}`,T=512,le=`https://t.me/reallifesame_bot/brodice`;function ue(e,t,n){let r=E(e);if(!r)return``;r.search=``,r.hash=``;let i=[w,t.createdAt.toString(36),String(n),t.faces.join(``)].join(`_`);return r.searchParams.set(ge(r)?S:x,i),r.toString()}function de(e,t){let n=E(e),r=[t,n?.searchParams.get(ce),n?.searchParams.get(S),n?.searchParams.get(x)];for(let e of r){let t=fe(e);if(t)return t}return null}function fe(e){let t=e?.trim();if(!t||t.length>T)return null;let n=t.startsWith(`${w}_`),[r,i,a,o,...s]=t.split(n?`_`:`.`),c=n?w:C;if(s.length>0||r!==c||!o)return null;let l=Number.parseInt(i??``,36),f=Number(a),p=[...o].map(Number);if(!Number.isSafeInteger(l)||l<=0||!u(f)||p.length<1||p.length>100||!p.every(d))return null;try{return _(p,f,l)}catch{return null}}function pe(e,t){let n=p(e.faces),r=m(e.faces,t),i=n.map((e,t)=>`${t+1}: ${e}`).join(` · `);return[`🎲 BroDice · ${e.faces.length}d6`,i,`${h(t)} successes: ${r}`].join(`
`)}async function me(e,t){let n=he(e.url);try{if(t.telegramShare?.(e.text,n)===!0)return`telegram`}catch{}if(t.nativeShare)try{return await t.nativeShare({...e,url:n}),`native`}catch(e){if(_e(e))return`cancelled`}if(t.writeClipboard)try{return await t.writeClipboard([e.text,n].filter(Boolean).join(`
`)),`clipboard`}catch{}return`failed`}function he(e){let t=E(e);if(!t)return``;let n=t.searchParams.get(S),r=t.searchParams.get(x);return t.search=``,t.hash=``,n&&ge(t)?t.searchParams.set(S,n.slice(0,T)):r&&t.searchParams.set(x,r.slice(0,T)),t.toString()}function ge(e){return e.protocol===`https:`&&e.hostname.toLowerCase()===`t.me`}function E(e){try{let t=new URL(e);return t.protocol===`http:`||t.protocol===`https:`?t:null}catch{return null}}function _e(e){return typeof e==`object`&&!!e&&`name`in e&&e.name===`AbortError`}function ve(e=window,t=document.documentElement.style){let n=e.Telegram?.WebApp,r=!1,i=()=>{let r=O(n?.viewportHeight)??e.innerHeight,i=O(n?.viewportStableHeight)??r;t.setProperty(`--tg-viewport-height`,`${Math.round(r)}px`),t.setProperty(`--tg-viewport-stable-height`,`${Math.round(i)}px`)},a=()=>{let e=n?.contentSafeAreaInset??n?.safeAreaInset;t.setProperty(`--tg-safe-top`,`${k(e?.top)}px`),t.setProperty(`--tg-safe-right`,`${k(e?.right)}px`),t.setProperty(`--tg-safe-bottom`,`${k(e?.bottom)}px`),t.setProperty(`--tg-safe-left`,`${k(e?.left)}px`)},o=e=>{try{e?.onEvent?.(`viewportChanged`,i)}catch{}try{e?.onEvent?.(`safeAreaChanged`,a)}catch{}try{e?.onEvent?.(`contentSafeAreaChanged`,a)}catch{}},s=e=>{try{e?.offEvent?.(`viewportChanged`,i)}catch{}try{e?.offEvent?.(`safeAreaChanged`,a)}catch{}try{e?.offEvent?.(`contentSafeAreaChanged`,a)}catch{}},c=()=>{if(r)return;let t=e.Telegram?.WebApp;t!==n&&(s(n),n=t,o(n));try{n?.ready?.(),n?.expand?.(),D(n,`7.7`)&&n?.disableVerticalSwipes?.(),D(n,`6.1`)&&(n?.setHeaderColor?.(`#0d1011`),n?.setBackgroundColor?.(`#080a0b`))}catch{}i(),a()};return e.addEventListener(`resize`,i,{passive:!0}),o(n),c(),Object.freeze({get isTelegram(){return n!==void 0},get startParam(){let e=n?.initDataUnsafe?.start_param;return typeof e==`string`&&e.trim()?e.trim():null},ready:c,haptic:e=>{if(!(r||!D(n,`6.1`)))try{e===`success`||e===`error`?n?.HapticFeedback?.notificationOccurred?.(e):n?.HapticFeedback?.impactOccurred?.(e)}catch{}},share:(e,t)=>{if(r||!n?.openTelegramLink)return!1;try{return n.openTelegramLink(ye(e,t)),!0}catch{return!1}},destroy:()=>{r||(s(n),e.removeEventListener(`resize`,i),r=!0)}})}function ye(e,t){let n=new URLSearchParams;return t&&n.set(`url`,t),n.set(`text`,e.trim().slice(0,1024)),`https://t.me/share/url?${n.toString()}`}function D(e,t){try{return e?.isVersionAtLeast?.(t)===!0}catch{return!1}}function O(e){return typeof e==`number`&&Number.isFinite(e)&&e>0?e:null}function k(e){return typeof e==`number`&&Number.isFinite(e)&&e>=0?Math.round(e):0}var be=[1,2,3,4,5,6],xe=[[5],[1,9],[1,5,9],[1,3,7,9],[1,3,5,7,9],[1,3,4,6,7,9]],Se=[2,3,4,5,6],Ce=[3,10,20,50],we=560,A=document.querySelector(`#app`);if(!A)throw Error(`BroDice app root is missing.`);var j=A,M=Ve(),N=ve(),P=b(M),F=P.diceCount,I=P.target,L=P.soundEnabled,R=v(M),z=de(window.location.href,N.startParam),B=z?`shared`:`fresh`,V=!1,H=!1,U=!1,W=``,G=null,K=null;z?(F=z.faces.length,I=z.target):He()&&(Ue(),window.setTimeout(()=>Z(`This shared roll link is invalid.`),0));function q(){let e=z?p(z.faces):null,t=z?m(z.faces,I):null,n=B===`shared`&&z!==null;j.innerHTML=`
    <main class="app-shell ${V?`is-rolling`:``}">
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
          <button class="icon-button ${L?`active`:``}" type="button" data-action="toggle-sound" aria-label="${L?`Mute roll sound`:`Enable roll sound`}" title="${L?`Sound on`:`Sound off`}">
            <span class="header-action-label" aria-hidden="true">${L?`SOUND`:`MUTED`}</span>
          </button>
          <button class="icon-button" type="button" data-action="open-history" aria-label="Open roll history" title="Roll history">
            <span class="header-action-label" aria-hidden="true">ROLLS</span>
            ${R.length>0?`<span class="history-badge">${R.length}</span>`:``}
          </button>
        </div>
      </header>

      ${n?Ee():Te()}
      ${De(z,e,t,n)}

      <footer><span>LOCAL RNG · SAVED ON THIS DEVICE</span><span>v0.1</span></footer>
    </main>
    ${H?Oe():``}
    ${W?`<div class="toast" role="status">${W}</div>`:``}
  `,Ae()}function Te(){return`
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
          <button type="button" data-action="decrement" aria-label="Remove one die" ${V?`disabled`:``}>−</button>
          <label>
            <span class="sr-only">Number of dice</span>
            <input id="dice-count" inputmode="numeric" type="number" min="1" max="100" value="${F}" ${V?`disabled`:``} />
          </label>
          <button type="button" data-action="increment" aria-label="Add one die" ${V?`disabled`:``}>+</button>
        </div>
        <div class="presets" aria-label="Quick dice amounts">
          ${Ce.map(e=>`
            <button class="${e===F?`active`:``}" type="button" data-count="${e}" ${V?`disabled`:``}>${e}</button>
          `).join(``)}
        </div>
      </div>

      <div class="field-group">
        <div class="field-label-row">
          <span class="field-label">SUCCESS ON</span>
          <span class="field-help">${Ke(I)}</span>
        </div>
        <div class="targets" role="group" aria-label="Minimum successful die result">
          ${Se.map(e=>`
            <button class="${e===I?`active`:``}" type="button" data-target="${e}" aria-pressed="${e===I}" ${V?`disabled`:``}>
              ${h(e)}
            </button>
          `).join(``)}
        </div>
      </div>

      <button class="roll-button" type="button" data-action="roll" ${V?`disabled`:``}>
        ${Q(5,`roll-die`)}
        <span>${V?`ROLLING…`:`ROLL ${F} ${F===1?`DIE`:`DICE`}`}</span>
      </button>
    </section>
  `}function Ee(){return`
    <aside class="shared-banner">
      <span class="shared-icon" aria-hidden="true">↗</span>
      <div>
        <strong>SHARED RESULT</strong>
      </div>
    </aside>
  `}function De(e,t,n,r){return!e&&!V?`
      <section class="results-panel results-empty" aria-live="polite">
        <div class="empty-result-copy">
          ${Q(5,`empty-result-die`)}
          <div>
            <p class="eyebrow">ROLL RESULT</p>
            <p class="awaiting">Ready to roll</p>
            <p class="result-note">Face counts and ${h(I)} successes will appear here.</p>
          </div>
        </div>
      </section>
    `:V?`
      <section class="results-panel results-rolling" aria-live="polite" aria-busy="true">
        <div class="result-summary">
          <p class="eyebrow">ROLLING ${F} DICE</p>
          <div class="rolling-display" aria-label="Rolling dice">${Q(1)}${Q(3)}${Q(5)}</div>
          <p class="result-note">Generating a secure local result…</p>
        </div>
      </section>
    `:`
    <section class="results-panel has-result" aria-live="polite" aria-busy="false">
      <div class="result-summary">
        <div class="result-context">
          <p class="eyebrow">${r?`SHARED ROLL`:B===`history`?`HISTORICAL ROLL`:`ROLL RESULT`}</p>
          <p class="result-note">${e?.faces.length??F} dice · ${We(e?.createdAt)}</p>
        </div>
        <p class="success-count ${n===0?`no-successes`:``}">
          <strong>${n}</strong>
          <span>${n===1?`SUCCESS`:`SUCCESSES`}<small>AT ${h(I)}</small></span>
        </p>
      </div>

      <div class="face-grid" role="list" aria-label="Counts for dice faces one through six">
        ${be.map((e,n)=>{let r=t?.[n]??0,i=e>=I;return`<div class="face-card ${i?`qualifies`:``}" role="listitem" aria-label="Face ${e}: ${r}${i?`, counts as success`:``}">
            <span class="face-label">FACE ${e}</span>
            ${Q(e,`face-die`)}
            <strong>${r}</strong>
          </div>`}).join(``)}
      </div>

      ${e?`
        <details class="individual-results">
          <summary>Individual dice <span>${e.faces.length}</span></summary>
          <div class="dice-list" role="list" aria-label="Individual dice results">
            ${e.faces.map((e,t)=>`<span class="die-chip ${e>=I?`qualifies`:``}" role="listitem">${Q(e,`chip-die`)}<span class="sr-only">Die ${t+1}: ${e}${e>=I?`, success`:``}</span></span>`).join(``)}
          </div>
        </details>
        <div class="result-actions">
          ${r?`<button class="primary-action" type="button" data-action="roll-own">ROLL YOUR OWN</button>`:`<button class="secondary-action" type="button" data-action="share">SHARE RESULT</button>`}
        </div>
      `:``}
    </section>
  `}function Oe(){return`
    <div class="sheet-backdrop" data-action="dismiss-history">
      <section class="history-sheet" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <header class="sheet-header">
          <div>
            <p class="eyebrow">DEVICE STORAGE</p>
            <h2 id="history-title">Roll history</h2>
          </div>
          <button class="icon-button" type="button" data-action="close-history" aria-label="Close roll history">×</button>
        </header>

        ${R.length===0?`<div class="empty-history">${Q(6,`empty-history-die`)}<strong>NO ROLLS RECORDED</strong><p>Your latest 20 rolls will stay on this device.</p></div>`:`<div class="history-list">
              ${R.map(ke).join(``)}
            </div>
            <div class="history-clear">
              ${U?`<p>Erase all local roll history?</p>
                   <div><button class="danger-action" type="button" data-action="confirm-clear">ERASE</button><button class="secondary-action" type="button" data-action="cancel-clear">CANCEL</button></div>`:`<button class="text-action" type="button" data-action="request-clear">CLEAR HISTORY</button>`}
            </div>`}
      </section>
    </div>
  `}function ke(e){let t=p(e.faces),n=m(e.faces,e.target);return`
    <article class="history-item">
      <button class="history-main" type="button" data-history-open="${e.id}">
        <span class="history-success ${n===0?`no-successes`:``}"><strong>${n}</strong><small>${h(e.target)}</small></span>
        <span class="history-copy">
          <strong>${e.faces.length}D6 · ${Ge(e.createdAt)}</strong>
          <small>${t.map((e,t)=>`${t+1}:${e}`).join(`  `)}</small>
        </span>
      </button>
      <button class="reroll-button" type="button" data-history-reroll="${e.id}" aria-label="Roll ${e.faces.length} dice again with target ${h(e.target)}">↻</button>
    </article>
  `}function Ae(){j.querySelector(`[data-action="toggle-sound"]`)?.addEventListener(`click`,Me),j.querySelector(`[data-action="open-history"]`)?.addEventListener(`click`,Ie),j.querySelector(`[data-action="decrement"]`)?.addEventListener(`click`,()=>J(F-1)),j.querySelector(`[data-action="increment"]`)?.addEventListener(`click`,()=>J(F+1)),j.querySelector(`#dice-count`)?.addEventListener(`change`,e=>{J(e.currentTarget.value)}),j.querySelector(`#dice-count`)?.addEventListener(`keydown`,e=>{e.key===`Enter`&&e.currentTarget.blur()}),j.querySelectorAll(`[data-count]`).forEach(e=>{e.addEventListener(`click`,()=>J(e.dataset.count))}),j.querySelectorAll(`[data-target]`).forEach(e=>{e.addEventListener(`click`,()=>je(Number(e.dataset.target)))}),j.querySelector(`[data-action="roll"]`)?.addEventListener(`click`,Ne),j.querySelector(`[data-action="share"]`)?.addEventListener(`click`,()=>void Pe()),j.querySelector(`[data-action="roll-own"]`)?.addEventListener(`click`,Fe),j.querySelector(`[data-action="close-history"]`)?.addEventListener(`click`,Y),j.querySelector(`[data-action="dismiss-history"]`)?.addEventListener(`click`,e=>{e.target===e.currentTarget&&Y()}),j.querySelector(`[data-action="request-clear"]`)?.addEventListener(`click`,()=>{U=!0,q()}),j.querySelector(`[data-action="cancel-clear"]`)?.addEventListener(`click`,()=>{U=!1,q()}),j.querySelector(`[data-action="confirm-clear"]`)?.addEventListener(`click`,ze),j.querySelectorAll(`[data-history-open]`).forEach(e=>{e.addEventListener(`click`,()=>Le(e.dataset.historyOpen))}),j.querySelectorAll(`[data-history-reroll]`).forEach(e=>{e.addEventListener(`click`,()=>Re(e.dataset.historyReroll))})}function J(e){V||B===`shared`||(F=l(e,P.diceCount),X(),N.haptic(`light`),q())}function je(e){V||B===`shared`||!u(e)||(I=e,X(),N.haptic(`light`),q())}function Me(){L=!L,X(),N.haptic(`light`),q()}function Ne(){V||B===`shared`||(V=!0,B=`fresh`,N.haptic(`medium`),N.isTelegram||qe(18),L&&i(),q(),G!==null&&window.clearTimeout(G),G=window.setTimeout(()=>{G=null;try{let e=_(f(F),I);z=e,R=te(M,e,R),V=!1,N.haptic(`success`),q(),$()}catch{V=!1,N.haptic(`error`),q(),Z(`Secure random generation is unavailable.`)}},we))}async function Pe(){if(!z||V||B===`shared`)return;let e=ue(le,z,I),t=await me({title:`BroDice roll`,text:pe(z,I),url:e},{telegramShare:N.share,nativeShare:typeof navigator.share==`function`?e=>navigator.share(e):void 0,writeClipboard:Be});t===`clipboard`?Z(`Result link copied.`):t===`failed`&&Z(`Could not share this roll.`)}function Fe(){Ue(),z=null,B=`fresh`,P=b(M),F=P.diceCount,I=P.target,L=P.soundEnabled,N.haptic(`light`),q()}function Ie(){H=!0,U=!1,N.haptic(`light`),q(),window.setTimeout(()=>j.querySelector(`[data-action="close-history"]`)?.focus(),0)}function Y(){H=!1,U=!1,q()}function Le(e){let t=R.find(t=>t.id===e);t&&(z=t,B=`history`,F=t.faces.length,I=t.target,H=!1,U=!1,N.haptic(`light`),q(),$())}function Re(e){let t=R.find(t=>t.id===e);t&&(F=t.faces.length,I=t.target,H=!1,U=!1,X(),q(),Ne())}function ze(){ne(M),R=Object.freeze([]),U=!1,N.haptic(`success`),q(),Z(`Roll history cleared.`)}function X(){P=Object.freeze({diceCount:F,target:I,soundEnabled:L}),se(M,P)}function Z(e){W=e.slice(0,160),K!==null&&window.clearTimeout(K),q(),K=window.setTimeout(()=>{W=``,K=null,q()},3e3)}async function Be(e){if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(e);return}let t=document.createElement(`textarea`);t.value=e,t.style.position=`fixed`,t.style.opacity=`0`,document.body.append(t),t.select();let n=document.execCommand(`copy`);if(t.remove(),!n)throw Error(`Clipboard is unavailable.`)}function Ve(){try{return window.localStorage}catch{return null}}function He(){try{let e=new URL(window.location.href).searchParams;return[N.startParam,e.get(`tgWebAppStartParam`),e.get(`startapp`),e.get(`roll`)].some(e=>e?.startsWith(`r1_`)||e?.startsWith(`1.`))}catch{return!1}}function Ue(){try{let e=new URL(window.location.href);e.searchParams.delete(`roll`),e.searchParams.delete(`startapp`),e.searchParams.delete(`tgWebAppStartParam`),e.hash=``,window.history.replaceState(null,``,e)}catch{}}function We(e){return e?new Intl.DateTimeFormat(`en`,{hour:`2-digit`,minute:`2-digit`}).format(e):`just now`}function Ge(e){return new Intl.DateTimeFormat(`en`,{month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`}).format(e)}function Ke(e){return e===6?`Only 6s count`:`${e}–6 count`}function Q(e,t=``){return`<span class="${[`die-face`,t].filter(Boolean).join(` `)}" aria-hidden="true">${xe[e-1].map(e=>`<span class="die-pip die-pip-${e}"></span>`).join(``)}</span>`}function $(){window.setTimeout(()=>{let e=j.querySelector(`.results-panel.has-result`);if(!e)return;let t=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches??!1;e.scrollIntoView({behavior:t?`auto`:`smooth`,block:`start`})},0)}function qe(e){try{navigator.vibrate?.(e)}catch{}}document.addEventListener(`keydown`,e=>{e.key===`Escape`&&H&&Y()}),window.addEventListener(`beforeunload`,()=>{G!==null&&window.clearTimeout(G),K!==null&&window.clearTimeout(K),N.destroy()},{once:!0}),q();