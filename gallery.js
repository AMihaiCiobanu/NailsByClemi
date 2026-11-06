// 3D coverflow gallery (#galerie). Swiper loads from the CDN only when the section comes near the
// screen, so it costs nothing on first paint. With reduced motion, or if Swiper fails to load, the
// photos stay in a plain scroll-snap row. Tap a photo to see it large (lightbox.js, via .gallery).
(() => {
  const node = document.querySelector('.cf');
  if (!node || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const SWIPER = 'https://cdn.jsdelivr.net/npm/swiper@11.2.10';

  const load = (tag, attrs) => new Promise((resolve, reject) => {
    const el = Object.assign(document.createElement(tag), attrs);
    el.onload = resolve;
    el.onerror = reject;
    document.head.appendChild(el);
  });

  async function start() {
    try {
      await Promise.all([
        load('link', { rel: 'stylesheet', href: `${SWIPER}/swiper-bundle.min.css` }),
        load('script', { src: `${SWIPER}/swiper-bundle.min.js` })
      ]);
    } catch { return; }
    if (!window.Swiper) return;
    node.classList.add('is-live');
    node.querySelector('.swiper-wrapper').removeAttribute('tabindex');
    const total = node.querySelectorAll('.cf-slide').length;
    new window.Swiper(node, {
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 'auto',
      loop: true,
      initialSlide: 1,
      speed: 650,
      autoplay: { delay: 2000, disableOnInteraction: false, pauseOnMouseEnter: true },
      coverflowEffect: { rotate: 38, stretch: 0, depth: 160, modifier: 1, slideShadows: false },
      keyboard: { enabled: true, onlyInViewport: true },
      pagination: { el: node.querySelector('.swiper-pagination'), clickable: true, dynamicBullets: true, dynamicMainBullets: 5 },
      a11y: {
        enabled: true,
        prevSlideMessage: 'Poza anterioară',
        nextSlideMessage: 'Poza următoare',
        paginationBulletMessage: `Poza {{index}} din ${total}`
      }
    });
  }

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    start();
  }, { rootMargin: '600px 0px' });
  io.observe(node);
})();
