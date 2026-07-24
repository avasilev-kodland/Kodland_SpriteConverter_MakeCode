(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[{symbol:`1`,red:255,green:255,blue:255},{symbol:`2`,red:255,green:33,blue:33},{symbol:`3`,red:255,green:147,blue:196},{symbol:`4`,red:255,green:129,blue:53},{symbol:`5`,red:255,green:246,blue:9},{symbol:`6`,red:36,green:156,blue:163},{symbol:`7`,red:120,green:220,blue:82},{symbol:`8`,red:0,green:63,blue:173},{symbol:`9`,red:135,green:242,blue:255},{symbol:`a`,red:142,green:46,blue:196},{symbol:`b`,red:164,green:131,blue:159},{symbol:`c`,red:92,green:64,blue:108},{symbol:`d`,red:229,green:205,blue:196},{symbol:`e`,red:145,green:70,blue:61},{symbol:`f`,red:0,green:0,blue:0}].map(e=>{let t=[b(e.red),b(e.green),b(e.blue)];return{...e,linear:t,oklab:x(t[0],t[1],t[2])}}),t=`.`,n=16;function r(e){let t=e.trim().replace(/[^\p{L}\p{N}_$]/gu,`_`);return t?/^[\p{L}_$]/u.test(t)?t:`sprite_${t}`:`mySprite`}function i(e){return Number.isFinite(e)?Math.min(500,Math.max(1,Math.round(e))):24}function a(e,t,n){let r=Math.max(1,e),a=Math.max(1,t);switch(n.sizeMode){case`original`:return{width:i(r),height:i(a)};case`fit-width`:return{width:160,height:i(160/r*a)};case`fit-height`:return{width:i(120/a*r),height:120};default:return{width:i(n.width),height:i(n.height)}}}function o(e,t){let{width:n,height:i}=a(e.naturalWidth,e.naturalHeight,t),o=s(e,n,i),{symbols:c,preview:l,transparentPixels:f}=d(o,n,i,u(o,n,i,t.transparency,t.backgroundTolerance),t.dither),p=[];for(let e=0;e<i;e+=1)p.push(`    ${c.slice(e*n,e*n+n).join(` `)}`);let m=_(n,i);return v(m).putImageData(l,0,0),{code:`${r(t.variableName)}.setImage(img\`\n${p.join(`
`)}\n\`)`,canvas:m,transparentPixels:f,width:n,height:i}}function s(e,t,n){let r=e.naturalWidth,i=e.naturalHeight,a=t/r,o=n/i,s=l(e),u=Math.abs(a-1)<.08&&Math.abs(o-1)<.08;return v(c(e,t,n,s||u||a>=.85&&o>=.85)).getImageData(0,0,t,n)}function c(e,t,n,r){if(r){let r=_(t,n),i=v(r);return i.imageSmoothingEnabled=!1,i.drawImage(e,0,0,t,n),r}let i=e instanceof HTMLCanvasElement?e:(()=>{let t=_(e.naturalWidth||e.width,e.naturalHeight||e.height);return g(v(t),e,t.width,t.height),t})(),a=i.width,o=i.height;for(;a>t*2||o>n*2;){let e=Math.max(t,Math.floor(a/2)),r=Math.max(n,Math.floor(o/2)),s=_(e,r);g(v(s),i,e,r),i=s,a=e,o=r}let s=_(t,n);return g(v(s),i,t,n),s}function l(e){let t=v(_(64,64));t.imageSmoothingEnabled=!1,t.drawImage(e,0,0,64,64);let r=t.getImageData(0,0,64,64).data,i=new Set;for(let e=0;e<r.length;e+=4){if(r[e+3]<n)continue;let t=r[e]>>3<<10|r[e+1]>>3<<5|r[e+2]>>3;if(i.add(t),i.size>48)return!1}let a=Math.max(e.naturalWidth,e.naturalHeight);return i.size<=48&&a<=512}function u(e,t,r,i,a){let o=e.data,s=new Uint8Array(t*r);for(let e=0;e<s.length;e+=1)o[e*4+3]<n&&(s[e]=1);if(i===`none`)return s;if(i===`black`||i===`white`){let e=i===`black`?[0,0,0]:[255,255,255],t=a*a;for(let n=0;n<s.length;n+=1)s[n]||h(o,n,e,t)&&(s[n]=1);return s}let c=m(o,t,r,s);if(!c)return s;let l=a*a,u=[],d=e=>{s[e]||h(o,e,c,l)&&(s[e]=1,u.push(e))};for(let e=0;e<t;e+=1)d(e),d((r-1)*t+e);for(let e=0;e<r;e+=1)d(e*t),d(e*t+t-1);for(;u.length>0;){let e=u.pop(),n=e%t,i=(e-n)/t;n>0&&d(e-1),n<t-1&&d(e+1),i>0&&d(e-t),i<r-1&&d(e+t)}return s}function d(e,n,r,i,a){let o=e.data,s=new Float32Array(n*r*3);for(let e=0;e<i.length;e+=1)i[e]||(s[e*3]=b(o[e*4]),s[e*3+1]=b(o[e*4+1]),s[e*3+2]=b(o[e*4+2]));let c=Array(n*r),l=new ImageData(n,r),u=0;for(let e=0;e<r;e+=1)for(let o=0;o<n;o+=1){let d=e*n+o,m=d*4;if(i[d]){c[d]=t,l.data[m+3]=0,u+=1;continue}let h=y(s[d*3]),g=y(s[d*3+1]),_=y(s[d*3+2]),v=p(h,g,_);c[d]=v.symbol,l.data[m]=v.red,l.data[m+1]=v.green,l.data[m+2]=v.blue,l.data[m+3]=255,a&&f(s,i,n,r,o,e,[h-v.linear[0],g-v.linear[1],_-v.linear[2]])}return{symbols:c,preview:l,transparentPixels:u}}function f(e,t,n,r,i,a,o){let s=(i,a,s)=>{if(i<0||i>=n||a<0||a>=r)return;let c=a*n+i;t[c]||(e[c*3]+=o[0]*s,e[c*3+1]+=o[1]*s,e[c*3+2]+=o[2]*s)};s(i+1,a,7/16),s(i-1,a+1,3/16),s(i,a+1,5/16),s(i+1,a+1,1/16)}function p(t,n,r){let[i,a,o]=x(t,n,r),s=e[0],c=1/0;for(let t of e){let e=i-t.oklab[0],n=a-t.oklab[1],r=o-t.oklab[2],l=e*e+n*n+r*r;l<c&&(s=t,c=l)}return s}function m(e,t,n,r){let i=0,a=0,o=0,s=0,c=t=>{r[t]||(i+=e[t*4],a+=e[t*4+1],o+=e[t*4+2],s+=1)};for(let e=0;e<t;e+=1)c(e),c((n-1)*t+e);for(let e=0;e<n;e+=1)c(e*t),c(e*t+t-1);return s===0?null:[i/s,a/s,o/s]}function h(e,t,n,r){let i=e[t*4]-n[0],a=e[t*4+1]-n[1],o=e[t*4+2]-n[2];return i*i+a*a+o*o<=r}function g(e,t,n,r){e.imageSmoothingEnabled=!0,e.imageSmoothingQuality=`high`,e.drawImage(t,0,0,n,r)}function _(e,t){let n=document.createElement(`canvas`);return n.width=e,n.height=t,n}function v(e){let t=e.getContext(`2d`,{willReadFrequently:!0});if(!t)throw Error(`Браузер не поддерживает Canvas 2D.`);return t}function y(e){return e<0?0:e>1?1:e}function b(e){let t=e/255;return t<=.04045?t/12.92:((t+.055)/1.055)**2.4}function x(e,t,n){let r=.4122214708*e+.5363325363*t+.0514459929*n,i=.2119034982*e+.6806995451*t+.1073969566*n,a=.0883024619*e+.2817188376*t+.6299787005*n,o=Math.cbrt(r),s=Math.cbrt(i),c=Math.cbrt(a);return[.2104542553*o+.793617785*s-.0040720468*c,1.9779984951*o-2.428592205*s+.4505937099*c,.0259040371*o+.7827717662*s-.808675766*c]}document.querySelector(`#app`).innerHTML=`
  <header class="topbar">
    <a class="brand" href="/" aria-label="Arcade Sprite Lab">
      <span class="brand-mark" aria-hidden="true">A</span>
      <span>Arcade Sprite Lab</span>
    </a>
  </header>

  <main>
    <section class="intro">
      <h1>Image to MakeCode Arcade sprite by Kodland</h1>
    </section>

    <section class="workspace">
      <div class="panel controls-panel">
        <label class="dropzone" id="dropzone" for="file-input">
          <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" />
          <span class="upload-icon" aria-hidden="true">↑</span>
          <strong>Choose image</strong>
          <span>or drop a PNG here</span>
          <small>PNG, JPG or WebP · up to 10 MB</small>
        </label>

        <div class="settings" aria-disabled="true" inert id="settings">
          <div class="field-group">
            <div class="field-label">
              <label>Sprite size</label>
              <span id="resolved-size">160×…</span>
            </div>
            <div class="size-options mode-options" role="group" aria-label="Size mode">
              <button type="button" class="is-active" data-mode="fit-width">Fit width 160</button>
              <button type="button" data-mode="fit-height">Fit height 120</button>
              <button type="button" data-mode="original">Original</button>
              <button type="button" data-mode="custom">Custom size</button>
            </div>
          </div>

          <div class="field-grid custom-only" id="custom-size-fields" hidden>
            <label>
              Width
              <input id="width" type="number" min="1" max="500" value="160" inputmode="numeric" />
            </label>
            <label>
              Height
              <input id="height" type="number" min="1" max="500" value="120" inputmode="numeric" />
            </label>
          </div>

          <div class="field-grid single-field">
            <label>
              Sprite name
              <input id="variable-name" type="text" value="hero" spellcheck="false" />
            </label>
          </div>

          <div class="field-group">
            <div class="field-label">
              <label>Transparency</label>
            </div>
            <div class="size-options transparency-options" role="group" aria-label="Transparency">
              <button type="button" class="is-active" data-transparency="black">Black → .</button>
              <button type="button" data-transparency="white">White → .</button>
              <button type="button" data-transparency="none">Keep background</button>
              <button type="button" data-transparency="auto-edge">Edge flood fill</button>
            </div>
          </div>

          <label class="range-field">
            <span>
              Background sensitivity
              <output id="tolerance-value">40</output>
            </span>
            <input id="tolerance" type="range" min="0" max="180" value="40" />
          </label>

          <label class="toggle-row">
            <span>
              <strong>Dithering</strong>
            </span>
            <input id="dither" type="checkbox" />
          </label>
        </div>
      </div>

      <div class="panel result-panel">
        <div class="preview-grid">
          <figure>
            <figcaption>Source</figcaption>
            <div class="preview-stage">
              <span class="empty-preview" id="original-empty">Upload an image</span>
              <img id="original-preview" alt="Uploaded image" hidden />
            </div>
          </figure>
          <figure>
            <figcaption>
              Sprite
              <span id="sprite-meta">—</span>
            </figcaption>
            <div class="preview-stage pixel-stage" id="sprite-preview">
              <span class="empty-preview">Sprite preview</span>
            </div>
          </figure>
        </div>

        <div class="code-section">
          <div class="code-heading">
            <h2>MakeCode code</h2>
            <span class="code-status" id="code-status">Upload an image first</span>
          </div>
          <textarea id="code-output" readonly spellcheck="false" aria-label="MakeCode code"></textarea>
          <button class="primary-button" id="copy-button" type="button" disabled>
            Copy code
          </button>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <span>Arcade Sprite Lab</span>
  </footer>
`;var S=Z(`file-input`),C=Z(`dropzone`),w=Z(`settings`),T=Z(`width`),E=Z(`height`),D=Z(`variable-name`),O=Z(`dither`),k=Z(`tolerance`),A=Z(`tolerance-value`),j=Z(`custom-size-fields`),M=Z(`resolved-size`),N=Z(`original-preview`),P=Z(`original-empty`),F=Z(`sprite-preview`),I=Z(`sprite-meta`),L=Z(`code-output`),R=Z(`copy-button`),z=Z(`code-status`),B=Array.from(document.querySelectorAll(`[data-mode]`)),V=Array.from(document.querySelectorAll(`[data-transparency]`)),H=null,U=null,W=null,G=`fit-width`,K=`black`;S.addEventListener(`change`,()=>{let e=S.files?.[0];e&&q(e)});for(let e of[`dragenter`,`dragover`])C.addEventListener(e,e=>{e.preventDefault(),C.classList.add(`is-dragging`)});for(let e of[`dragleave`,`drop`])C.addEventListener(e,e=>{e.preventDefault(),C.classList.remove(`is-dragging`)});C.addEventListener(`drop`,e=>{let t=e.dataTransfer?.files[0];t&&q(t)});for(let e of B)e.addEventListener(`click`,()=>{G=e.dataset.mode,Y(),J()});for(let e of V)e.addEventListener(`click`,()=>{K=e.dataset.transparency;for(let t of V)t.classList.toggle(`is-active`,t===e);J()});for(let e of[T,E,D,O,k])e.addEventListener(`input`,()=>{A.value=k.value,G===`custom`&&(T.value=String(i(Number(T.value))),E.value=String(i(Number(E.value)))),J()});R.addEventListener(`click`,async()=>{if(W){try{await navigator.clipboard.writeText(W.code)}catch{L.select(),document.execCommand(`copy`)}R.textContent=`Copied`,R.classList.add(`is-success`),window.setTimeout(()=>{R.textContent=`Copy code`,R.classList.remove(`is-success`)},1800)}}),Y();async function q(e){if(!new Set([`image/png`,`image/jpeg`,`image/webp`]).has(e.type)){X(`Use a PNG, JPG, or WebP file.`);return}if(e.size>10485760){X(`File is larger than 10 MB.`);return}U&&URL.revokeObjectURL(U),U=URL.createObjectURL(e);let t=new Image;t.decoding=`async`,t.src=U;try{await t.decode()}catch{X(`Could not read the image.`);return}H=t,N.src=U,N.hidden=!1,P.hidden=!0,w.removeAttribute(`aria-disabled`),w.removeAttribute(`inert`),C.classList.add(`has-file`),C.querySelector(`strong`).textContent=e.name,C.querySelector(`small`).textContent=`${t.naturalWidth}×${t.naturalHeight} · ${Q(e.size)}`;let n=Math.max(t.naturalWidth,t.naturalHeight);G=n<=320&&t.naturalWidth!==t.naturalHeight||n<=128?`original`:`fit-width`,Y(),J()}function J(){if(H)try{let e=a(H.naturalWidth,H.naturalHeight,{sizeMode:G,width:Number(T.value),height:Number(E.value)});M.textContent=`${e.width}×${e.height}`,W=o(H,{sizeMode:G,width:Number(T.value),height:Number(E.value),variableName:D.value,transparency:K,backgroundTolerance:Number(k.value),dither:O.checked}),F.replaceChildren(W.canvas),I.textContent=`${W.width}×${W.height} · ${W.transparentPixels} transparent`,L.value=W.code,R.disabled=!1,z.textContent=`Ready`,z.classList.remove(`is-error`)}catch(e){X(e instanceof Error?e.message:`Could not convert the image.`)}}function Y(){for(let e of B)e.classList.toggle(`is-active`,e.dataset.mode===G);j.hidden=G!==`custom`}function X(e){W=null,R.disabled=!0,z.textContent=e,z.classList.add(`is-error`)}function Z(e){let t=document.getElementById(e);if(!t)throw Error(`Element #${e} not found`);return t}function Q(e){return e<1024*1024?`${Math.round(e/1024)} KB`:`${(e/1024/1024).toFixed(1)} MB`}