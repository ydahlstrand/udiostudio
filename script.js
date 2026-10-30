document.getElementById('year').textContent = new Date().getFullYear();

// Switch nav colour depending on the section underneath it
const nav = document.querySelector('.nav');
const navParts = nav.querySelectorAll('.logo, nav, .menu-btn');
function updateNav() {
  nav.style.visibility = 'hidden';
  const under = document.elementFromPoint(window.innerWidth / 2, 30)?.closest('[data-nav]');
  // each part checks whether it sits over a light photo (e.g. white-background portraits)
  const overLight = [...navParts].map((part) => {
    const r = part.getBoundingClientRect();
    if (!r.width) return false;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return hit?.matches('img[data-tone="light"]');
  });
  nav.style.visibility = '';
  const mode = under?.dataset.nav;
  nav.classList.toggle('light', mode === 'light');
  nav.classList.toggle('on-red', mode === 'red');
  navParts.forEach((part, i) => part.classList.toggle('on-light', overLight[i]));
}
addEventListener('scroll', updateNav, { passive: true });
updateNav();

// Mobile menu
const menu = document.getElementById('menu');
const menuBtn = document.querySelector('.menu-btn');
function setMenu(open) {
  menu.classList.toggle('open', open);
  menu.setAttribute('aria-hidden', !open);
  menuBtn.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
menuBtn.addEventListener('click', () => setMenu(true));
menu.querySelector('.menu-close').addEventListener('click', () => setMenu(false));
menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Fade sections in as they scroll into view
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Typing terminal in the engineering section
const term = document.getElementById('term');
const lines = [
  ['$ ', 'udio new client-project --stack fullstack'],
  ['', '<span class="ok">✓</span> scaffolded web app, api, database'],
  ['$ ', 'udio add ai --retrieval --agents'],
  ['', '<span class="ok">✓</span> connected to your documents and tools'],
  ['$ ', 'udio ship --production'],
  ['', '<span class="acc">✺</span> live. tested. documented.'],
];
let started = false;
async function type() {
  started = true;
  let html = '';
  for (const [prompt, text] of lines) {
    if (prompt) {
      html += prompt;
      for (const ch of text) {
        html += ch;
        term.innerHTML = html + '<span class="caret"></span>';
        await new Promise((r) => setTimeout(r, 28));
      }
    } else {
      await new Promise((r) => setTimeout(r, 350));
      html += text;
    }
    html += '\n';
    term.innerHTML = html + '<span class="caret"></span>';
  }
}
new IntersectionObserver((entries, obs) => {
  if (entries[0].isIntersecting && !started) { type(); obs.disconnect(); }
}, { threshold: 0.4 }).observe(term);

// Slideshows (drone, brand): cross-fade every few seconds; thumbnails pick a photo, clicking the photo shows the next
const pad = (n) => String(n).padStart(2, '0');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.viewer').forEach((viewer) => {
  const box = viewer.querySelector('.slides');
  const slides = box.querySelectorAll('img');
  const thumbs = viewer.querySelectorAll('.thumb');
  const count = viewer.closest('.frame').querySelector('.slide-count');
  let current = 0;
  let timer;
  function show(n) {
    slides[current].classList.remove('on');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('on');
    thumbs.forEach((t, i) => { t.classList.toggle('on', i === current); t.setAttribute('aria-selected', i === current); });
    count.textContent = `${pad(current + 1)} / ${pad(slides.length)}`;
    updateNav();
  }
  function start() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => show(current + 1), 4500);
  }
  box.addEventListener('click', () => { show(current + 1); start(); });
  box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(current + 1); start(); } });
  thumbs.forEach((t, i) => t.addEventListener('click', () => { show(i); start(); }));
  slides.forEach((img) => { img.loading = 'eager'; });
  start();
});

// Contact form: send through Web3Forms without leaving the page
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = form.querySelector('.send');
  button.disabled = true;
  status.textContent = 'Sending…';
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });
    const data = await res.json();
    if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || 'Request failed');
    form.reset();
    status.textContent = 'Thank you — your message is on its way.';
  } catch (err) {
    console.error('[contact form]', err.message);
    status.textContent = 'Something went wrong. Please try again in a moment.';
  } finally {
    button.disabled = false;
  }
});
