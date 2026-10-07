// Services and working hours are read live from the owner's Appointments & Reports account,
// through the same public booking link the online booking page uses. The result is cached in
// localStorage for 5 minutes so repeat visits render instantly without hitting Firestore.

const BOOKING_LINK_ID = '3ab7628e-2be5-4ca7-a060-84ee93618f29';
const CACHE_KEY = 'clemi_data_v3';
const CACHE_TTL_MS = 5 * 60 * 1000;

const FIREBASE_VERSION = '10.14.1';
const firebaseConfig = {
  apiKey: 'AIzaSyDVcYMPg0lWd4tMxlfm5MLS8T6jtEXcoi8',
  authDomain: 'appointmentssync-c680f.firebaseapp.com',
  projectId: 'appointmentssync-c680f',
  storageBucket: 'appointmentssync-c680f.firebasestorage.app',
  messagingSenderId: '600609525849',
  appId: '1:600609525849:web:6d37c54629691bf6752148'
};
const RECAPTCHA_SITE_KEY = '6LcieqUsAAAAAJi2J0k-aawVuqpArTNRx1iccCRr';

const CURRENCY_SYMBOLS = {
  RON: 'lei', EUR: '€', GBP: '£', USD: '$', BRL: 'R$', CHF: 'Fr', HUF: 'Ft', BGN: 'лв', PLN: 'zł',
  INR: '₹', TRY: '₺', SEK: 'kr', NOK: 'kr', DKK: 'kr', CZK: 'Kč', AED: 'د.إ',
  RUB: '₽', KZT: '₸', KGS: 'с', UZS: "so'm"
};

// Monday first, keys as stored in users/{uid}/setari/bookingPublic (minutes from midnight).
const DAYS = [
  { label: 'Luni', key: 'Luni' },
  { label: 'Marți', key: 'Marti' },
  { label: 'Miercuri', key: 'Miercuri' },
  { label: 'Joi', key: 'Joi' },
  { label: 'Vineri', key: 'Vineri' },
  { label: 'Sâmbătă', key: 'Sambata' },
  { label: 'Duminică', key: 'Duminica' }
];

const SERVICE_GROUPS = [
  { label: 'Servicii', match: s => !s.isClass && !s.isSubscription },
  { label: 'Abonamente', match: s => s.isSubscription },
  { label: 'Cursuri', match: s => s.isClass }
];

// Local preview talks to the main site served on :8080; production uses the live booking page.
const BOOKING_ORIGIN = location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://appointmentsapps.com';
const bookingUrl = `https://appointmentsapps.com/booking?id=${BOOKING_LINK_ID}`;

// ---------- cache ----------

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && Array.isArray(data.services) ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* storage unavailable: page still works, just without caching */ }
}

// ---------- Firestore ----------

async function fetchData() {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const [{ initializeApp }, { initializeAppCheck, ReCaptchaV3Provider }, fs] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-app-check.js`),
    import(`${base}/firebase-firestore.js`)
  ]);
  const { getFirestore, doc, getDoc, collection, getDocs, query, where, Timestamp } = fs;

  const app = initializeApp(firebaseConfig);
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch { /* App Check enforcement is off; never block the read on it */ }
  const db = getFirestore(app);

  const linkSnap = await getDoc(doc(db, 'bookingLinks', BOOKING_LINK_ID));
  if (!linkSnap.exists()) throw new Error('booking link missing');
  const link = linkSnap.data();
  const expiresAt = link.expiresAt?.toDate?.() || null;
  if (link.isDeleted || link.active === false || (expiresAt && expiresAt.getTime() < Date.now()) || !link.uid) {
    throw new Error('booking link inactive');
  }

  const [publicSnap, servicesSnap] = await Promise.all([
    getDoc(doc(db, `users/${link.uid}/setari/bookingPublic`)),
    getDocs(collection(db, `users/${link.uid}/servicii`))
  ]);
  const settings = publicSnap.exists() ? publicSnap.data() : {};

  let services = servicesSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.isDeleted !== true && s.showService !== false)
    .map(s => ({
      id: s.id,
      name: s.nume || '',
      durationMinutes: Number(s.durataMinute || 0),
      price: Number(s.pret || 0),
      showPrice: s.showPrice !== false,
      description: s.serviceDescription || '',
      isClass: s.tipServiciu === 'CLASS',
      isSubscription: s.tipServiciu === 'SUBSCRIPTION'
    }))
    .filter(s => s.name && s.durationMinutes > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ro'));

  // Same rule as the booking page: a class whose whole series has already been held cannot be
  // booked on any date, so it is not listed. A failed read keeps every class listed.
  if (services.some(s => s.isClass)) {
    try {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const sessionsSnap = await getDocs(query(
        collection(db, `users/${link.uid}/classSessions`),
        where('startDate', '>=', Timestamp.fromDate(dayStart))
      ));
      const bookable = new Set(sessionsSnap.docs
        .map(d => d.data())
        .filter(row => {
          const start = row.startDate?.toDate?.();
          const end = row.endDate?.toDate?.();
          return row.isDeleted !== true && start && end && end > start;
        })
        .map(row => row.serviceId || ''));
      services = services.filter(s => !s.isClass || bookable.has(s.id));
    } catch { /* keep every class listed */ }
  }

  const hours = DAYS.map(day => {
    const start = Number(settings[`programStart${day.key}`] || 0);
    const end = Number(settings[`programEnd${day.key}`] || 0);
    return start >= 0 && end > start && end <= 1439 ? { start, end } : null;
  });

  return {
    fetchedAt: Date.now(),
    currency: settings.currency || 'RON',
    hasHours: Object.keys(settings).length > 0,
    services,
    hours
  };
}

// ---------- rendering ----------

function formatPrice(amount, currencyCode) {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${formatted} ${symbol}`;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function hhmm(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderServices(data) {
  const container = document.getElementById('services');
  const errorEl = document.getElementById('services-error');
  container.replaceChildren();

  if (!data.services.length) {
    errorEl.classList.remove('hidden');
    return;
  }
  errorEl.classList.add('hidden');

  const groups = SERVICE_GROUPS
    .map(g => ({ ...g, items: data.services.filter(g.match) }))
    .filter(g => g.items.length);
  const showHeadings = groups.length > 1;

  for (const group of groups) {
    if (showHeadings) container.appendChild(el('h3', 'service-group-title', group.label));
    for (const svc of group.items) {
      const card = el('a', 'service');
      card.href = `${bookingUrl}&service=${encodeURIComponent(svc.id)}`;
      card.dataset.serviceId = svc.id;

      const top = el('div', 'service-top');
      top.appendChild(el('span', 'service-name', svc.name));
      if (svc.showPrice && svc.price > 0) top.appendChild(el('span', 'service-price', formatPrice(svc.price, data.currency)));
      card.appendChild(top);

      card.appendChild(el('span', 'service-meta', formatDuration(svc.durationMinutes)));
      if (svc.description) card.appendChild(el('p', 'service-desc', svc.description));
      card.appendChild(el('span', 'service-cta', 'Programează-te →'));
      container.appendChild(card);
    }
  }
}

function renderHours(data) {
  const tbody = document.querySelector('#hours-table tbody');
  const note = document.getElementById('hours-note');
  const badge = document.getElementById('open-badge');
  tbody.replaceChildren();

  if (!data.hasHours) {
    note.textContent = 'Vezi orele disponibile în pagina de programare.';
    return;
  }
  note.textContent = 'Programul poate varia în zilele libere — orele exacte le vezi la programare.';

  const now = new Date();
  const todayIndex = (now.getDay() + 6) % 7; // Monday = 0
  DAYS.forEach((day, i) => {
    const range = data.hours[i];
    const row = el('tr');
    if (i === todayIndex) row.classList.add('today');
    if (!range) row.classList.add('closed');
    row.appendChild(el('td', null, day.label));
    row.appendChild(el('td', null, range ? `${hhmm(range.start)} – ${hhmm(range.end)}` : 'Închis'));
    tbody.appendChild(row);
  });

  const today = data.hours[todayIndex];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = !!today && nowMinutes >= today.start && nowMinutes < today.end;
  badge.textContent = isOpen ? `Deschis acum · până la ${hhmm(today.end)}` : 'Închis acum · programează-te online';
  badge.classList.toggle('is-open', isOpen);
  badge.hidden = false;
}

function render(data) {
  renderServices(data);
  renderHours(data);
}

// ---------- booking dialog ----------

// The booking page itself runs inside the dialog (embed=1), opened straight on the calendar of
// the chosen service, so visitors book without leaving this page. Modifier clicks still open
// the booking page in a new tab, and without JavaScript every link goes there directly.

function embeddedBookingUrl(serviceId) {
  const params = new URLSearchParams({
    id: BOOKING_LINK_ID,
    embed: '1',
    lang: 'ro',
    theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  });
  if (serviceId) params.set('service', serviceId);
  return `${BOOKING_ORIGIN}/booking/?${params}`;
}

function setupBookingDialog() {
  const dialog = document.getElementById('booking-dialog');
  const body = document.getElementById('booking-dialog-body');
  if (!dialog || typeof dialog.showModal !== 'function') return; // old browser: plain links

  // A fresh iframe per opening: changing an existing iframe's src adds entries to the joint
  // session history, which would make Back step through the iframe instead of closing.
  let frame = null;
  // A reload while the dialog was open lands back on its history entry; start clean.
  if (history.state?.bookingDialog) history.replaceState(null, '');

  function finishClose() {
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('dialog-open');
    frame?.remove();
    frame = null;
  }

  // Opening pushes a history entry so the phone's Back button closes the dialog
  // instead of leaving the page.
  function requestClose() {
    if (history.state?.bookingDialog) history.back();
    else finishClose();
  }

  function open(serviceId) {
    frame?.remove();
    frame = document.createElement('iframe');
    frame.title = 'Programare online';
    frame.src = embeddedBookingUrl(serviceId);
    // The booking page reports when its first screen (the calendar) has settled; until then
    // the loader stays up. Fallback in case that message never arrives.
    const shown = frame;
    frame.addEventListener('load', () => setTimeout(() => reveal(shown), 8000), { once: true });
    body.appendChild(frame);
    document.documentElement.classList.add('dialog-open');
    dialog.showModal();
    history.pushState({ bookingDialog: true }, '');
  }

  function reveal(target) {
    if (target && target === frame) frame.classList.add('is-loaded');
  }

  window.addEventListener('message', e => {
    if (e.origin === BOOKING_ORIGIN && e.data?.type === 'booking-ready' && e.source === frame?.contentWindow) {
      reveal(frame);
    }
  });

  document.getElementById('booking-dialog-close').addEventListener('click', requestClose);
  dialog.addEventListener('cancel', e => { e.preventDefault(); requestClose(); });
  dialog.addEventListener('click', e => { if (e.target === dialog) requestClose(); });
  window.addEventListener('popstate', () => { if (dialog.open) finishClose(); });

  document.addEventListener('click', e => {
    const link = e.target.closest('a.service, a.booking-link');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(link.dataset.serviceId || '');
  });
}

// ---------- theme ----------

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#1b1415' : '#fbf3f1';
}

function setupThemeToggle() {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch { /* choice lasts for this visit only */ }
  });

  // Until the visitor picks a theme, keep following the system setting.
  media.addEventListener('change', e => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch { /* ignore */ }
    if (!saved) applyTheme(e.matches ? 'dark' : 'light');
  });
}

// ---------- boot ----------

async function init() {
  setupThemeToggle();
  setupBookingDialog();
  document.getElementById('year').textContent = String(new Date().getFullYear());

  const cached = readCache();
  if (cached) render(cached);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return;

  try {
    const fresh = await fetchData();
    writeCache(fresh);
    render(fresh);
  } catch (err) {
    console.warn('Could not load services', err);
    if (!cached) {
      document.getElementById('services').replaceChildren();
      document.getElementById('services-error').classList.remove('hidden');
      document.getElementById('hours-note').textContent = 'Vezi orele disponibile în pagina de programare.';
    }
  }
}

init();
