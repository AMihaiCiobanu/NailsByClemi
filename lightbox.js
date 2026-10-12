// Gallery preview: click a photo in a gallery to open it large. Arrows / swipe / Esc to navigate.
// Self-contained (injects its own styles). Add: <script src="…/lightbox.js" defer></script>
(() => {
  const GROUPS = '.gallery, .holes, .plates, .slider, #carousel, .studio-photo';
  const css = `
.lb-open{cursor:zoom-in}
.lb [hidden]{display:none!important}
.lb{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(10,10,12,.92);opacity:0;transition:opacity .18s;touch-action:pan-y}
.lb.on{opacity:1}
.lb figure{margin:0;max-width:min(94vw,1400px);max-height:92vh;display:flex;flex-direction:column;align-items:center;gap:10px}
.lb img{max-width:100%;max-height:82vh;object-fit:contain;border-radius:10px;box-shadow:0 12px 50px rgba(0,0,0,.5);background:#222}
.lb figcaption{color:#eee;font:500 .95rem/1.3 system-ui,-apple-system,'Segoe UI',sans-serif;text-align:center;max-width:80ch}
.lb button{position:absolute;display:grid;place-items:center;width:46px;height:46px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font:400 26px/1 system-ui,sans-serif;cursor:pointer}
.lb button:hover,.lb button:focus-visible{background:rgba(255,255,255,.28);outline:2px solid #fff}
.lb .lb-x{top:14px;right:14px}.lb .lb-p{left:12px;top:50%;margin-top:-23px}.lb .lb-n{right:12px;top:50%;margin-top:-23px}
.lb-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;width:min(86vw,640px);aspect-ratio:4/3;border-radius:10px;color:#e8e8ee;text-align:center;padding:24px;background:repeating-linear-gradient(135deg,transparent 0 16px,rgba(255,255,255,.04) 16px 32px),linear-gradient(135deg,#3b3b46,#1f1f26);border:1px dashed rgba(255,255,255,.3);font:600 1rem/1.3 system-ui,sans-serif}
.lb-tile svg{width:72px;height:72px}.lb-tile small{font-weight:500;opacity:.7}
.lb-count{position:absolute;top:22px;left:18px;color:#ddd;font:600 .85rem system-ui,sans-serif}
@media(max-width:600px){.lb .lb-p,.lb .lb-n{top:auto;bottom:18px;margin:0}}
@media(prefers-reduced-motion:reduce){.lb{transition:none}}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  let box, imgEl, tileEl, capEl, countEl, items = [], idx = 0, lastFocus = null, down = null;

  const full = (src) => /images\.unsplash\.com/.test(src)
    ? src.replace(/([?&])w=\d+/, '$1w=1600').replace(/&h=\d+/, '')
    : src;

  function build() {
    box = document.createElement('div');
    box.className = 'lb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo preview');
    box.innerHTML = '<span class="lb-count"></span><button class="lb-x" type="button" aria-label="Close">×</button>' +
      '<button class="lb-p" type="button" aria-label="Previous photo">‹</button>' +
      '<button class="lb-n" type="button" aria-label="Next photo">›</button>' +
      '<figure><img alt=""><div class="lb-tile" hidden></div><figcaption></figcaption></figure>';
    imgEl = box.querySelector('img');
    tileEl = box.querySelector('.lb-tile');
    capEl = box.querySelector('figcaption');
    countEl = box.querySelector('.lb-count');
    box.addEventListener('click', (e) => {
      if (e.target.closest('.lb-p')) return step(-1);
      if (e.target.closest('.lb-n')) return step(1);
      if (!e.target.closest('img, figcaption')) close();
    });
    let sx = null;
    box.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });
    document.body.appendChild(box);
  }

  function show() {
    const it = items[idx];
    imgEl.hidden = !!it.tile;
    tileEl.hidden = !it.tile;
    if (it.tile) {
      tileEl.replaceChildren();
      if (it.icon) tileEl.appendChild(it.icon.cloneNode(true));
      tileEl.append(it.caption);
      const small = document.createElement('small');
      small.textContent = 'Sample image. On your page this is your own photo.';
      tileEl.appendChild(small);
    } else {
      imgEl.src = full(it.src);
      imgEl.alt = it.alt;
    }
    capEl.textContent = it.tile ? '' : it.caption;
    capEl.hidden = it.tile || !it.caption;
    countEl.textContent = items.length > 1 ? `${idx + 1} / ${items.length}` : '';
    box.querySelector('.lb-p').hidden = box.querySelector('.lb-n').hidden = items.length < 2;
  }
  function step(d) { idx = (idx + d + items.length) % items.length; show(); }
  function close() {
    if (!box || !box.isConnected) return;
    document.removeEventListener('keydown', onKey, true);
    box.remove();
    document.documentElement.style.overflow = '';
    lastFocus?.focus?.();
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') { e.preventDefault(); box.querySelector('.lb-x').focus(); }
  }

  function open(list, i) {
    items = list; idx = i;
    lastFocus = document.activeElement;
    if (!box) build();
    show();
    document.body.appendChild(box);
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => box.classList.add('on'));
    document.addEventListener('keydown', onKey, true);
    box.querySelector('.lb-x').focus();
  }

  const toItem = (n) => {
    if (n.tagName !== 'IMG') { // placeholder tile without a photo yet
      return { tile: true, icon: n.querySelector('svg'), caption: n.querySelector('figcaption')?.textContent.trim() || '' };
    }
    const fig = n.closest('figure');
    return { src: n.currentSrc || n.src, alt: n.alt || '', caption: fig?.querySelector('figcaption')?.textContent.trim() || n.dataset.caption || n.alt || '' };
  };
  const members = (group) => [...group.querySelectorAll('img, figure.photo')].filter((n) => n.tagName === 'IMG' || !n.querySelector('img'));

  // ignore clicks that end a drag (3D ring, scrollers)
  document.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; }, true);

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-lightbox-open]');
    if (opener) { // e.g. a "View photo" button for a background slideshow
      const src = document.querySelector(opener.dataset.lightboxOpen);
      const imgs = src ? [...src.querySelectorAll('img')] : [];
      if (imgs.length) open(imgs.map(toItem), Math.max(0, imgs.findIndex((i) => i.classList.contains('is-on'))));
      return;
    }
    if (e.defaultPrevented || e.target.closest('.lb, a, button')) return;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    let t = e.target;
    let group = t.closest(GROUPS);
    if (!group) { // pointer capture (3D ring) retargets the click: hit-test the point instead
      t = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n.closest(GROUPS) && (n.tagName === 'IMG' || n.closest('figure')));
      group = t && t.closest(GROUPS);
    }
    if (!group) return;
    const fig = t.closest('figure');
    const hit = t.tagName === 'IMG' ? t : (fig?.querySelector('img') || (fig && fig.classList.contains('photo') ? fig : null));
    if (!hit || !group.contains(hit)) return;
    const list = members(group);
    open(list.map(toItem), list.indexOf(hit));
  });

  for (const g of document.querySelectorAll(GROUPS)) g.classList.add('lb-open');
  // groups rendered later by scripts
  new MutationObserver(() => {
    for (const g of document.querySelectorAll(GROUPS)) g.classList.add('lb-open');
  }).observe(document.body, { childList: true, subtree: true });
})();
