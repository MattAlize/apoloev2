document.documentElement.classList.add('js');

// Menu mobile
const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('menu');

function setMenu(open) {
  menu.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('is-open')) {
    setMenu(false);
    toggle.focus();
  }
});

// Sélecteur de tarifs
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const shelves = [...document.querySelectorAll('.shelf')];

function selectTab(tab) {
  const target = tab.getAttribute('aria-controls');
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  });
  panels.forEach((p) => { p.hidden = p.id !== target; });
  shelves.forEach((s) => s.classList.toggle('is-on', s.dataset.for === target));
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = tabs[(i + step + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
});
selectTab(tabs[0]);

// Apparition au défilement
const revealed = document.querySelectorAll('.head, .steps__list li, .bouquet__img, .bouquet__txt, .board figure, .gallery__grid figure, .private__title');
const revealer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    revealer.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px -8% 0px' });
revealed.forEach((el) => {
  el.classList.add('reveal');
  revealer.observe(el);
});

// Masque le bouton mobile quand la billetterie ou le bouton de l'accueil sont à l'écran
const sticky = document.querySelector('.stickybook');
const heroCopy = document.querySelector('.scroll-hero__copy');
let bookingInView = false;
let heroCopyInView = false;

function updateSticky() {
  const heroCopyShown = heroCopyInView && heroCopy.style.visibility !== 'hidden';
  sticky.classList.toggle('is-off', bookingInView || heroCopyShown);
}

new IntersectionObserver(([entry]) => {
  bookingInView = entry.isIntersecting;
  updateSticky();
}).observe(document.getElementById('reserver'));

new IntersectionObserver(([entry]) => {
  heroCopyInView = entry.isIntersecting;
  updateSticky();
}).observe(heroCopy);
document.addEventListener('herocopychange', updateSticky);
