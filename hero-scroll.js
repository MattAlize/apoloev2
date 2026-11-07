// Accueil animé au défilement : croquis → couleur posée au pinceau → travelling vidéo.
// Sans GSAP, ou avec « réduire les animations », la photo en couleur reste affichée, fixe.
(() => {
  const hero = document.querySelector('.scroll-hero');
  if (!hero) return;

  const stage = hero.querySelector('.scroll-hero__stage');
  const paint = hero.querySelector('.scroll-hero__paint');
  const color = hero.querySelector('.scroll-hero__color');
  const strokes = hero.querySelector('.scroll-hero__strokes');
  const fill = hero.querySelector('.scroll-hero__fill');
  const video = hero.querySelector('.scroll-hero__video');
  const copy = hero.querySelector('.scroll-hero__copy');
  const scrim = hero.querySelector('.scroll-hero__scrim');
  const cue = hero.querySelector('.scroll-hero__cue');
  const header = document.querySelector('.top');

  const mobile = window.matchMedia('(max-width: 767px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const format = () => (mobile.matches ? '9x16' : '16x9');

  function setHeaderOffset() {
    document.documentElement.style.setProperty('--top-h', `${header.offsetHeight}px`);
  }

  function pickColorImage() {
    color.setAttribute('href', `assets/peniche-${format()}.jpg`);
  }

  setHeaderOffset();
  pickColorImage();
  mobile.addEventListener('change', pickColorImage);

  if (reduced.matches || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  hero.classList.add('is-animated');
  color.setAttribute('mask', 'url(#coups-de-pinceau)');

  const { clamp, mapRange } = gsap.utils;
  const step = (value, from, to) => clamp(0, 1, mapRange(from, to, 0, 1, value));
  const easeOut = (t) => 1 - (1 - t) ** 3;

  // Coups de pinceau : des bandes ondulées, peintes en alternance de gauche à droite,
  // chacune bordée de fins « poils » qui donnent des bords irréguliers.
  let paths = [];

  function random(seed) {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function buildStrokes() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const rand = random(7);
    const count = 3;
    const band = h / count;
    const svgNS = 'http://www.w3.org/2000/svg';

    strokes.replaceChildren();
    paths = [];

    for (let i = 0; i < count; i++) {
      const y = band * (i + 0.5);
      const reverse = i % 2 === 1;
      const start = (i / count) * 0.5;
      const bristles = [
        { dy: 0, width: band * 1.25, lag: 0 },
        { dy: -band * 0.62, width: band * 0.32, lag: 0.03 },
        { dy: band * 0.6, width: band * 0.28, lag: 0.05 },
        { dy: -band * 0.36, width: band * 0.5, lag: 0.015 },
        { dy: band * 0.38, width: band * 0.46, lag: 0.025 },
      ];

      bristles.forEach(({ dy, width, lag }) => {
        const wave = band * 0.18;
        const pts = [
          [-0.12 * w, y + dy + (rand() - 0.5) * wave],
          [0.3 * w, y + dy + (rand() - 0.5) * wave * 2],
          [0.7 * w, y + dy + (rand() - 0.5) * wave * 2],
          [1.12 * w, y + dy + (rand() - 0.5) * wave],
        ];
        if (reverse) pts.reverse();
        const [a, b, c, d] = pts;
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', `M${a} C${b} ${c} ${d}`);
        path.setAttribute('pathLength', '1');
        path.setAttribute('stroke-width', width.toFixed(1));
        path.setAttribute('stroke-dasharray', '1 1');
        strokes.append(path);
        paths.push({ el: path, start: start + lag + rand() * 0.02, length: 0.42 });
      });
    }
  }

  function paintTo(progress) {
    paths.forEach(({ el, start, length }) => {
      const t = step(progress, start, start + length);
      el.style.strokeDashoffset = 1 - easeOut(t);
      el.style.visibility = t > 0 ? 'visible' : 'hidden';
    });
    // Comble les derniers interstices quand la peinture est presque finie
    fill.setAttribute('opacity', step(progress, 0.82, 1).toFixed(3));
  }

  // Vidéo : chargée après la page, puis positionnée image par image selon le défilement,
  // de la première à la dernière image, flash d'entrée dans la cabine compris.
  let target = 0;
  let loadedFormat = null;

  function loadVideo() {
    const wanted = format();
    if (loadedFormat === wanted) return;
    loadedFormat = wanted;
    video.src = `assets/travelling-${wanted}-scrub.mp4`;
    video.preload = 'auto';
    video.load();
  }

  function seek() {
    if (!video.duration || video.seeking) return;
    if (Math.abs(video.currentTime - target) > 0.01) video.currentTime = target;
  }
  video.addEventListener('seeked', seek);
  video.addEventListener('loadedmetadata', seek);

  // iOS n'autorise le positionnement qu'après une première interaction
  document.addEventListener('touchstart', () => {
    video.play().then(() => video.pause()).catch(() => {});
  }, { once: true, passive: true });

  function render(p) {
    paintTo(step(p, 0.02, 0.24));
    cue.style.opacity = 1 - step(p, 0.01, 0.06);

    // La vidéo apparaît en fondu dès les derniers coups de pinceau, déjà en mouvement
    video.style.opacity = step(p, 0.15, 0.25);
    const played = step(p, 0.17, 0.97);
    // Avance plus vite au début (approche lente dans la vidéo), plus posément dans la cabine
    if (video.duration) target = (1 - (1 - played) ** 1.4) * (video.duration - 1 / 24);
    seek();

    // Le texte s'efface pendant l'approche, avant le flash d'entrée dans la péniche
    const out = step(played, 0.14, 0.3);
    copy.style.opacity = 1 - out;
    copy.style.translate = `0 ${-24 * out}px`;
    const visibility = out >= 1 ? 'hidden' : 'visible';
    if (copy.style.visibility !== visibility) {
      copy.style.visibility = visibility;
      document.dispatchEvent(new Event('herocopychange'));
    }
    scrim.style.opacity = 1 - out;
  }

  buildStrokes();

  const trigger = ScrollTrigger.create({
    trigger: hero,
    start: () => `top ${header.offsetHeight}px`,
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => {
      setHeaderOffset();
      buildStrokes();
      render(self.progress);
    },
  });

  mobile.addEventListener('change', () => {
    loadVideo();
    render(trigger.progress);
  });

  if (document.readyState === 'complete') loadVideo();
  else window.addEventListener('load', loadVideo, { once: true });
  render(trigger.progress);
})();
