// Halloween extras: scarecrow that scares on click (sounds synthesized with Web Audio, no files)
// and a sound on/off button. Runs only when the head script set <html data-season="halloween">.

(function () {
  if (document.documentElement.dataset.season !== 'halloween') return;

  const SOUND_KEY = 'halloween_sound';
  let soundOn = true;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch (_) { }

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const BAT = '<path class="wing" d="M20 14c-3-6-9-9-18-8 4 2 5 5 5 8-2 0-4 1-5 3 4-1 7 0 9 3 1-3 4-4 9-4z"/>'
    + '<path class="wing" d="M20 14c3-6 9-9 18-8-4 2-5 5-5 8 2 0 4 1 5 3-4-1-7 0-9 3-1-3-4-4-9-4z"/>'
    + '<ellipse cx="20" cy="16" rx="3.2" ry="5"/><path d="M17.5 11.5l1-4 1.5 2 1.5-2 1 4z"/>';

  const WEB = '<svg class="hw-web" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">'
    + '<path d="M0 0L120 0M0 0L105 60M0 0L60 105M0 0L0 120M0 0L100 100"/>'
    + '<path d="M30 0Q26 26 0 30M60 0Q52 52 0 60M90 0Q78 78 0 90M118 0Q104 104 0 118"/></svg>';

  const PUMPKIN = '<svg class="hw-pumpkin" viewBox="0 0 80 70" aria-hidden="true">'
    + '<path d="M38 12c0-5 2-8 6-9" stroke="#6bbf59" stroke-width="4" stroke-linecap="round" fill="none"/>'
    + '<ellipse cx="22" cy="40" rx="18" ry="24" fill="#e8620c"/><ellipse cx="58" cy="40" rx="18" ry="24" fill="#e8620c"/>'
    + '<ellipse cx="40" cy="40" rx="20" ry="26" fill="#ff7a1a"/>'
    + '<path d="M26 34l7 10-14 0zM54 34l7 10-14 0z" fill="#2a0f4d"/>'
    + '<path d="M24 52q16 14 32 0l-4-2-4 4-4-4-4 4-4-4-4 4-4-4z" fill="#2a0f4d"/></svg>';

  const SCARECROW = '<svg viewBox="0 0 120 200" aria-hidden="true">'
    // post and arms
    + '<rect x="55" y="100" width="10" height="100" rx="3" fill="#5a3a22"/>'
    + '<rect x="6" y="86" width="108" height="9" rx="4.5" fill="#6b4529"/>'
    // red nails on the hands, straw below
    + '<g stroke="#d6213f" stroke-width="3" stroke-linecap="round"><path d="M8 88l-8-5M8 91l-9 1M8 94l-8 5M112 88l8-5M112 91l9 1M112 94l8 5"/></g>'
    + '<g stroke="#e0a43a" stroke-width="2.5" stroke-linecap="round"><path d="M44 150l-6 12M52 152l-2 14M60 153v14M68 152l2 14M76 150l6 12"/></g>'
    // shirt with patches
    + '<path d="M32 88h56l-6 64H38z" fill="#7a3b9f"/>'
    + '<path d="M32 88h56v8H32z" fill="#5d2b7c"/>'
    + '<rect x="42" y="110" width="16" height="16" rx="2" fill="#ff7a1a" transform="rotate(-6 50 118)"/>'
    + '<rect x="66" y="124" width="14" height="14" rx="2" fill="#3c2a1a" transform="rotate(8 73 131)"/>'
    + '<path d="M44 114l12 0M44 119l12 0" stroke="#2a0f4d" stroke-width="1.2" stroke-dasharray="2 2" transform="rotate(-6 50 118)"/>'
    // head
    + '<circle cx="60" cy="60" r="25" fill="#e8c277"/>'
    + '<path class="eye" d="M44 52l11 4-11 4z M76 52l-11 4 11 4z"/>'
    + '<path d="M58 62l2 6 2-6z" fill="#b78a3c"/>'
    + '<path class="mouth" d="M46 74l4-4 5 4 5-4 5 4 5-4 4 4" fill="none" stroke="#2a0f4d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M50 70v8M60 70v8M70 70v8" stroke="#2a0f4d" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>'
    // straw under hat
    + '<g stroke="#e0a43a" stroke-width="2.5" stroke-linecap="round"><path d="M36 46l-9 3M35 54l-10 4M85 46l9 3M85 54l10 4"/></g>'
    // hat
    + '<ellipse cx="60" cy="40" rx="40" ry="8" fill="#2b1d3d"/>'
    + '<path d="M40 38c0-18 6-30 20-30s20 12 20 30z" fill="#352350"/>'
    + '<rect x="40" y="30" width="40" height="8" fill="#ff7a1a"/>'
    + '<circle cx="76" cy="30" r="5" fill="#f4ecff"/><circle cx="76" cy="30" r="2" fill="#e8620c"/></svg>';

  /* ---------- Sounds ---------- */
  let ctx = null;
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(c, type, t0, dur, freqPoints, vol, filterHz) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    freqPoints.forEach(function (p, i) {
      if (i === 0) osc.frequency.setValueAtTime(p[1], t0 + p[0]);
      else osc.frequency.linearRampToValueAtTime(p[1], t0 + p[0]);
    });
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.05, dur / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (filterHz) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterHz;
      osc.connect(f);
      node = f;
    }
    node.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    return osc;
  }

  const SOUNDS = [
    // "Bhuuu": ghostly wail with tremolo
    function (c, t) {
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 7;
      lfoGain.gain.value = 18;
      const o = tone(c, 'sine', t, 1.3, [[0, 420], [0.25, 520], [1.3, 150]], 0.3);
      lfo.connect(lfoGain);
      lfoGain.connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + 1.4);
      tone(c, 'sine', t, 0.5, [[0, 110], [0.5, 45]], 0.4);
    },
    // witch cackle: quick falling pulses
    function (c, t) {
      for (let i = 0; i < 7; i++) {
        const s = t + i * 0.12;
        const base = 760 - i * 35;
        tone(c, 'sawtooth', s, 0.1, [[0, base], [0.1, base - 220]], 0.16, 1800);
      }
    },
    // creaking door
    function (c, t) {
      const pts = [[0, 140]];
      for (let i = 1; i <= 20; i++) pts.push([i * 0.045, 110 + Math.random() * 170]);
      tone(c, 'sawtooth', t, 0.95, pts, 0.18, 900);
    },
    // scream: fast rise then shaky hold
    function (c, t) {
      const pts = [[0, 500], [0.18, 1500]];
      for (let i = 1; i <= 10; i++) pts.push([0.18 + i * 0.07, 1350 + (i % 2 ? 140 : -140)]);
      pts.push([1.1, 700]);
      tone(c, 'sawtooth', t, 1.1, pts, 0.14, 3200);
      tone(c, 'square', t, 0.9, pts.map(function (p) { return [p[0], p[1] * 1.5]; }), 0.04, 3000);
    }
  ];
  let last = -1;

  function playScare() {
    if (!soundOn) return;
    const c = audio();
    if (!c) return;
    let i;
    do { i = Math.floor(Math.random() * SOUNDS.length); } while (i === last);
    last = i;
    SOUNDS[i](c, c.currentTime + 0.01);
  }

  /* ---------- DOM ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    const decor = document.createElement('div');
    decor.className = 'hw-decor';
    decor.setAttribute('aria-hidden', 'true');
    let bats = '';
    for (let i = 0; i < 3; i++) bats += '<svg class="hw-bat" viewBox="0 0 40 28" aria-hidden="true">' + BAT + '</svg>';
    decor.innerHTML = WEB + bats + PUMPKIN;
    hero.insertBefore(decor, hero.firstChild);
  }

  const scarecrow = document.createElement('button');
  scarecrow.type = 'button';
  scarecrow.className = 'scarecrow';
  scarecrow.setAttribute('aria-label', 'Sperietoare de Halloween — apasă ca să o auzi');
  scarecrow.innerHTML = '<span class="scare-bubble" aria-hidden="true">Bhuuu!</span>' + SCARECROW;
  document.body.appendChild(scarecrow);

  const BUBBLES = ['Bhuuu!', 'Hihihi!', 'Hei, ai grijă!', 'Buu!'];
  let timer = 0;
  scarecrow.addEventListener('click', function () {
    scarecrow.querySelector('.scare-bubble').textContent = BUBBLES[Math.floor(Math.random() * BUBBLES.length)];
    scarecrow.classList.remove('is-scared');
    void scarecrow.offsetWidth; // restart the animation on rapid clicks
    scarecrow.classList.add('is-scared');
    clearTimeout(timer);
    timer = setTimeout(function () { scarecrow.classList.remove('is-scared'); }, 1400);
    if (soundOn && navigator.vibrate) navigator.vibrate(60);
    playScare();
  });

  const actions = document.querySelector('.topbar-actions');
  if (actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sound-toggle';
    btn.setAttribute('aria-label', 'Sunet sperietoare');
    btn.innerHTML = '<svg class="icon-on" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>'
      + '<svg class="icon-off" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    const sync = function () { btn.setAttribute('aria-pressed', soundOn ? 'true' : 'false'); };
    sync();
    btn.addEventListener('click', function () {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (_) { }
      sync();
      if (soundOn) playScare();
    });
    actions.insertBefore(btn, actions.firstChild);
  }

  /* ---------- Spiders crawling over the page ---------- */
  // Glossy 3D-looking spiders (radial-gradient body, highlighted legs, drop shadow) that wander across
  // the viewport, plus one that now and then lowers itself from the top on a silk thread.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) initSpiders();

  function initSpiders() {
    // Left legs: joint, control point, tip. Right legs are mirrored around x = 50.
    const LEGS = [
      [[45, 38], [28, 22], [12, 12]],
      [[44, 43], [24, 34], [6, 34]],
      [[44, 49], [24, 54], [8, 62]],
      [[45, 55], [28, 68], [16, 90]]
    ];
    function legs() {
      let out = '';
      [1, -1].forEach(function (side) {
        LEGS.forEach(function (l, i) {
          const p = l.map(function (pt) { return [side === 1 ? pt[0] : 100 - pt[0], pt[1]]; });
          const d = 'M' + p[0] + ' Q' + p[1] + ' ' + p[2];
          const phase = (i + (side === 1 ? 0 : 1)) % 2 ? 'b' : 'a';
          out += '<g class="hw-leg ' + phase + '" style="transform-origin:' + p[0][0] + 'px ' + p[0][1] + 'px">'
            + '<path d="' + d + '" stroke="#2a1a40" stroke-width="3.8" fill="none" stroke-linecap="round"/>'
            + '<path d="' + d + '" stroke="#a98ee0" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55" transform="translate(-.7 -.7)"/></g>';
        });
      });
      return out;
    }
    const SPIDER = '<svg viewBox="0 0 100 100" aria-hidden="true">' + legs()
      + '<ellipse cx="50" cy="62" rx="14" ry="18" fill="url(#hw-body)"/>'
      + '<ellipse cx="50" cy="40" rx="9" ry="9.5" fill="url(#hw-body)"/>'
      + '<path d="M50 54l4 8-4 8-4-8z" fill="#ff7a1a" opacity=".9"/>'
      + '<ellipse cx="44" cy="55" rx="4" ry="7" fill="#fff" opacity=".16" transform="rotate(-12 44 55)"/>'
      + '<circle cx="46.5" cy="34" r="2" fill="#ff3d3d"/><circle cx="53.5" cy="34" r="2" fill="#ff3d3d"/>'
      + '<circle cx="46" cy="33.4" r=".7" fill="#fff"/><circle cx="53" cy="33.4" r=".7" fill="#fff"/></svg>';

    const layer = document.createElement('div');
    layer.className = 'hw-spiders';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<svg width="0" height="0" style="position:absolute"><defs>'
      + '<radialGradient id="hw-body" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#b79cf0"/>'
      + '<stop offset=".45" stop-color="#3d2a5e"/><stop offset="1" stop-color="#120a20"/></radialGradient></defs></svg>';
    document.body.appendChild(layer);

    const spiders = [];
    function make(cls) {
      const el = document.createElement('div');
      el.className = 'hw-spider ' + (cls || '');
      el.innerHTML = SPIDER;
      layer.appendChild(el);
      return el;
    }

    const count = window.innerWidth < 768 ? 2 : 3;
    for (let i = 0; i < count; i++) {
      const s = {
        el: make(),
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        a: Math.random() * Math.PI * 2, // heading, 0 = up
        speed: 0,
        top: 55 + Math.random() * 50,
        pause: Math.random() * 2,
        tx: 0, ty: 0
      };
      pick(s);
      spiders.push(s);
    }

    function pick(s) {
      const m = 40;
      s.tx = m + Math.random() * (window.innerWidth - 2 * m);
      s.ty = m + Math.random() * (window.innerHeight - 2 * m);
      s.top = 55 + Math.random() * 55;
    }

    let prev = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      spiders.forEach(function (s) {
        if (s.pause > 0) {
          s.pause -= dt;
          s.speed = 0;
          s.el.classList.remove('walking');
        } else {
          const dx = s.tx - s.x, dy = s.ty - s.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 12) { s.pause = 0.6 + Math.random() * 2.4; pick(s); }
          else {
            const want = Math.atan2(dx, -dy);
            let diff = want - s.a;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            s.a += Math.max(-4 * dt, Math.min(4 * dt, diff));
            // slow down while turning sharply, so it pivots like a real one
            const target = Math.abs(diff) > 0.9 ? 12 : s.top;
            s.speed += (target - s.speed) * Math.min(1, dt * 5);
            s.x += Math.sin(s.a) * s.speed * dt;
            s.y -= Math.cos(s.a) * s.speed * dt;
            s.el.classList.add('walking');
          }
        }
        s.el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px) rotate(' + s.a.toFixed(3) + 'rad)';
      });
      raf = requestAnimationFrame(frame);
    }
    let raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', function () {
      cancelAnimationFrame(raf);
      if (!document.hidden) { prev = performance.now(); raf = requestAnimationFrame(frame); }
    });

    // The one on a thread: drops in from the top every so often, dangles, then climbs back out.
    const dangler = document.createElement('div');
    dangler.className = 'hw-dangler';
    dangler.innerHTML = '<span class="hw-thread"></span>' + '<div class="hw-spider walking">' + SPIDER + '</div>';
    layer.appendChild(dangler);
    function drop() {
      const depth = 110 + Math.random() * Math.min(240, window.innerHeight * 0.4);
      dangler.style.left = (30 + Math.random() * (window.innerWidth - 90)) + 'px';
      const home = 'translateY(0)';
      const down = 'translateY(' + depth + 'px)';
      const anim = dangler.animate([
        { transform: home, offset: 0 },
        { transform: down, offset: 0.3 },
        { transform: 'translateY(' + (depth - 22) + 'px)', offset: 0.45 },
        { transform: down, offset: 0.6 },
        { transform: 'translateY(' + (depth - 14) + 'px)', offset: 0.75 },
        { transform: down, offset: 0.85 },
        { transform: home, offset: 1 }
      ], { duration: 9000, easing: 'ease-in-out' });
      anim.onfinish = function () { setTimeout(drop, 15000 + Math.random() * 20000); };
    }
    setTimeout(drop, 4000);
  }

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', '#150f1f');
})();
