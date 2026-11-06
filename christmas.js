// Christmas extras: big snowflakes falling over the page and a snowman with red nails who now and then
// lifts his hand to admire them. Runs only when the head script set <html data-season="christmas">.

(function () {
  if (document.documentElement.dataset.season !== 'christmas') return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Snow ---------- */
  // One six-armed crystal, drawn twice: a soft blue-grey outline under a white stroke,
  // so the flakes stay visible on the light pink background too.
  const ARM = 'M0 0V-44M0-16L-9-25M0-16L9-25M0-30L-7-37M0-30L7-37';
  let arms = '';
  for (let i = 0; i < 6; i++) arms += '<path d="' + ARM + '" transform="rotate(' + i * 60 + ')"/>';
  const FLAKE = '<svg viewBox="-50 -50 100 100" aria-hidden="true">'
    + '<g fill="none" stroke-linecap="round" stroke-linejoin="round">'
    + '<g stroke="#9fb6d1" stroke-width="11" opacity=".55">' + arms + '</g>'
    + '<g stroke="#fff" stroke-width="6">' + arms + '<circle r="6" fill="#fff"/></g>'
    + '</g></svg>';

  if (!reduced) {
    const snow = document.createElement('div');
    snow.className = 'xm-snow';
    snow.setAttribute('aria-hidden', 'true');
    const count = window.innerWidth < 768 ? 14 : 24;
    let html = '';
    for (let i = 0; i < count; i++) {
      const size = 18 + Math.random() * 26; // big flakes: 18–44px
      const dur = 10 + Math.random() * 10;
      html += '<span class="xm-flake" style="'
        + '--x:' + (Math.random() * 100).toFixed(1) + 'vw;'
        + '--size:' + size.toFixed(0) + 'px;'
        + '--dur:' + dur.toFixed(1) + 's;'
        + '--delay:' + (-Math.random() * dur).toFixed(1) + 's;'
        + '--sway:' + (2.5 + Math.random() * 3).toFixed(1) + 's;'
        + '--drift:' + (14 + Math.random() * 30).toFixed(0) + 'px;'
        + '--spin:' + (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 180).toFixed(0) + 'deg;'
        + '--o:' + (0.7 + Math.random() * 0.3).toFixed(2)
        + '"><i>' + FLAKE + '</i></span>';
    }
    snow.innerHTML = html;
    document.body.appendChild(snow);
  }

  /* ---------- Hero: tinsel garland and Christmas tree ---------- */
  const TREE = '<svg class="xm-tree" viewBox="0 0 100 132" aria-hidden="true">'
    + '<rect x="43" y="108" width="14" height="16" rx="2" fill="#7a4b2a"/>'
    + '<path d="M50 14L14 62h14L8 92h18L2 116h96L74 92h18L72 62h14z" fill="#1f6b45"/>'
    + '<path d="M50 14L14 62h14L8 92h18L2 116h48z" fill="#2a8456"/>'
    // tinsel
    + '<g fill="none" stroke="#e2b443" stroke-width="2.2" stroke-linecap="round">'
    + '<path d="M30 52q20 8 36-4M20 82q30 12 58-6M12 108q40 12 76-6"/></g>'
    // lights
    + '<g><circle class="xm-light" cx="40" cy="44" r="3.4" fill="#ff5a6e"/><circle class="xm-light" cx="60" cy="58" r="3.4" fill="#ffd25a"/>'
    + '<circle class="xm-light" cx="32" cy="72" r="3.6" fill="#7fd0ff"/><circle class="xm-light" cx="66" cy="80" r="3.6" fill="#ff5a6e"/>'
    + '<circle class="xm-light" cx="48" cy="90" r="3.6" fill="#ffd25a"/><circle class="xm-light" cx="22" cy="104" r="3.8" fill="#ff5a6e"/>'
    + '<circle class="xm-light" cx="56" cy="110" r="3.8" fill="#7fd0ff"/><circle class="xm-light" cx="80" cy="104" r="3.8" fill="#ffd25a"/></g>'
    // star
    + '<path class="xm-star" d="M50 0l4.1 8.6 9.4 1.2-6.9 6.5 1.8 9.3L50 21l-8.4 4.6 1.8-9.3-6.9-6.5 9.4-1.2z" fill="#f5c84b" stroke="#c9952a" stroke-width="1"/>'
    // gift
    + '<rect x="70" y="112" width="22" height="18" rx="2" fill="#c2233f"/><rect x="79" y="112" width="4" height="18" fill="#f5c84b"/>'
    + '<path d="M81 112c-6-7-11-2-6 0zM81 112c6-7 11-2 6 0z" fill="#f5c84b"/>'
    + '</svg>';

  const hero = document.querySelector('.hero');
  if (hero) {
    const garland = document.createElement('div');
    garland.className = 'xm-garland';
    garland.setAttribute('aria-hidden', 'true');
    hero.insertBefore(garland, hero.firstChild);
    const visual = hero.querySelector('.hero-visual');
    if (visual) visual.insertAdjacentHTML('beforeend', TREE);
  }

  // Browser bar colour follows the winter palette (app.js sets the default pink one).
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const syncMeta = function () {
      const want = document.documentElement.dataset.theme === 'dark' ? '#0e1726' : '#f3f7fb';
      if (meta.content !== want) meta.content = want;
    };
    new MutationObserver(syncMeta).observe(meta, { attributes: true, attributeFilter: ['content'] });
    syncMeta();
  }

  /* ---------- Snowman ---------- */
  // Twig fingers ending in red nails. The right arm (.xm-arm) swings up so the hand is next to his face,
  // the eyes and head turn towards it, and the nails sparkle.
  const FINGERS = '<g stroke="#6b4529" stroke-width="3" stroke-linecap="round" fill="none">'
    + '<path d="M124 118l9-6M124 118l11 1M124 118l8 8"/></g>'
    + '<g class="xm-nails" fill="#d6213f">'
    + '<ellipse cx="134" cy="111.4" rx="2.6" ry="2" transform="rotate(-34 134 111.4)"/>'
    + '<ellipse cx="136.3" cy="119" rx="2.6" ry="2"/>'
    + '<ellipse cx="133" cy="127" rx="2.6" ry="2" transform="rotate(45 133 127)"/></g>';

  const SNOWMAN = '<svg viewBox="0 0 150 200" aria-hidden="true">'
    + '<ellipse cx="70" cy="190" rx="44" ry="7" fill="#9fb6d1" opacity=".35"/>'
    // left arm (static, waves a little)
    + '<g class="xm-arm-l"><path d="M50 98L16 80M27 86l-6-10M27 86l-11 1" stroke="#6b4529" stroke-width="3.2" stroke-linecap="round" fill="none"/>'
    + '<g fill="#d6213f"><ellipse cx="14.6" cy="79.2" rx="2.6" ry="2"/><ellipse cx="20.4" cy="75" rx="2" ry="2.6"/><ellipse cx="15" cy="87" rx="2.6" ry="2"/></g></g>'
    // body
    + '<circle cx="70" cy="152" r="36" fill="#fff" stroke="#c9d7e6" stroke-width="2"/>'
    + '<path d="M44 168q26 18 54 0" stroke="#e3ecf5" stroke-width="6" fill="none" stroke-linecap="round"/>'
    + '<circle cx="70" cy="100" r="25" fill="#fff" stroke="#c9d7e6" stroke-width="2"/>'
    + '<g fill="#2b1d1f"><circle cx="70" cy="96" r="3.2"/><circle cx="70" cy="108" r="3.2"/><circle cx="70" cy="140" r="3.6"/></g>'
    // scarf
    + '<path d="M50 80q20 9 40 0l1 7q-21 9-42 0z" fill="#c2233f"/>'
    + '<path d="M80 84l5 22-8 1-3-21z" fill="#a51b33"/>'
    + '<path d="M78 98l8-1M79 102l8-1" stroke="#f7d9d6" stroke-width="1.6"/>'
    // head (turns towards the hand)
    + '<g class="xm-head">'
    + '<g stroke="#6b4529" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M70 30V16M70 22l-6-6M70 24l7-7M64 32l-5-9"/></g>'
    + '<ellipse cx="70" cy="54" rx="25" ry="24" fill="#fff" stroke="#c9d7e6" stroke-width="2"/>'
    + '<ellipse cx="54" cy="62" rx="5" ry="3" fill="#f7c7cf" opacity=".8"/><ellipse cx="88" cy="62" rx="5" ry="3" fill="#f7c7cf" opacity=".8"/>'
    + '<g class="xm-eyes"><ellipse cx="61" cy="49" rx="4.6" ry="5.6" fill="#fff" stroke="#2b1d1f" stroke-width="1.4"/>'
    + '<ellipse cx="79" cy="49" rx="4.6" ry="5.6" fill="#fff" stroke="#2b1d1f" stroke-width="1.4"/>'
    + '<g class="xm-pupils" fill="#2b1d1f"><circle cx="61" cy="50" r="2.6"/><circle cx="79" cy="50" r="2.6"/></g>'
    + '<path class="xm-lids" d="M56 44q5-4 10 0M74 44q5-4 10 0" stroke="#2b1d1f" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>'
    + '<path d="M70 55l18 4-18 3z" fill="#f08a24"/>'
    + '<path class="xm-mouth" d="M60 66q10 8 20 0" stroke="#2b1d1f" stroke-width="2" fill="none" stroke-linecap="round"/>'
    + '</g>'
    // right arm, drawn last so the hand passes in front of the face
    + '<g class="xm-arm"><path d="M90 95L124 118" stroke="#6b4529" stroke-width="3.2" stroke-linecap="round"/>' + FINGERS
    + '<g class="xm-sparkle" fill="#fff8d6"><path d="M142 106l1.4 3.2 3.2 1.4-3.2 1.4-1.4 3.2-1.4-3.2-3.2-1.4 3.2-1.4z"/>'
    + '<path d="M141 126l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z"/></g></g>'
    + '</svg>';

  const snowman = document.createElement('button');
  snowman.type = 'button';
  snowman.className = 'snowman';
  snowman.setAttribute('aria-label', 'Om de zăpadă cu unghii roșii — apasă să le vezi');
  snowman.innerHTML = '<span class="xm-bubble" aria-hidden="true"></span>' + SNOWMAN;
  document.body.appendChild(snowman);

  const bubble = snowman.querySelector('.xm-bubble');
  const LINES = ['Ia uite ce unghii! 💅', 'Roșu de Crăciun ❤️', 'Mi le-a făcut Clemi!', 'Nici nu se topesc!'];
  let lineIx = -1;
  let busy = false;
  let endTimer = 0;

  function admire(talk) {
    if (talk) {
      lineIx = (lineIx + 1) % LINES.length;
      bubble.textContent = LINES[lineIx];
    }
    snowman.classList.toggle('is-talking', !!talk);
    snowman.classList.remove('is-admiring');
    void snowman.offsetWidth; // restart the animation on rapid clicks
    snowman.classList.add('is-admiring');
    busy = true;
    clearTimeout(endTimer);
    endTimer = setTimeout(function () {
      snowman.classList.remove('is-admiring', 'is-talking');
      busy = false;
    }, 3200);
  }

  snowman.addEventListener('click', function () { admire(true); });

  if (!reduced) {
    // Glance at the nails every 6–11 s, without talking.
    (function loop() {
      setTimeout(function () {
        if (!busy && !document.hidden) admire(false);
        loop();
      }, 6000 + Math.random() * 5000);
    })();
  }
})();
