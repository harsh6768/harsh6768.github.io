import * as THREE from 'three';
import { profile, experience, education, projects, skills } from './data.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Populate content from data.js ---------- */
document.getElementById('about-text').textContent = profile.about;
document.getElementById('linkedin').href = profile.linkedin;
document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById('timeline').innerHTML = experience.map((e) => `
  <li class="reveal">
    <h3>${e.role} · ${e.company}</h3>
    <div class="meta">${e.period}</div>
    ${e.points.length ? `<ul class="points">${e.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
    ${e.skills ? `<p class="skills-line">${e.skills}</p>` : ''}
  </li>`).join('');

document.getElementById('education').innerHTML = education.map((e) => `
  <li class="reveal">
    <h3>${e.school}</h3>
    <div class="meta">${e.period}</div>
    <p>${e.degree}</p>
    ${e.detail ? `<p class="skills-line">${e.detail}</p>` : ''}
  </li>`).join('');

document.getElementById('cards').innerHTML = projects.map((p) => `
  <article class="card reveal">
    <a class="overlay" href="${p.url}" target="_blank" rel="noopener" aria-label="${p.name} on GitHub"></a>
    <h3>${p.name}</h3>
    <p>${p.desc}</p>
    <div class="foot"><span>${p.lang}</span>${p.live ? `<a class="live" href="${p.live}" target="_blank" rel="noopener">Live ↗</a>` : `<span>★ ${p.stars}</span>`}</div>
  </article>`).join('');

document.getElementById('chips').innerHTML = skills.map((s) => `<span class="chip">${s}</span>`).join('');

/* ---------- Scroll reveal + counters ---------- */
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('in');
    entry.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(entry.target);
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

function countUp(el) {
  const target = Number(el.dataset.count);
  if (reduceMotion) { el.textContent = target; return; }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / 1400, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- 3D tilt on project cards ---------- */
if (!reduceMotion && matchMedia('(pointer: fine)').matches) {
  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest?.('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) translateZ(8px)`;
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest?.('.card');
    if (card) card.style.transform = '';
  });
}

/* ---------- Three.js background ---------- */
const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060f, 0.08);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.z = 6;

const accent = new THREE.Color(0x00f0ff);
const violet = new THREE.Color(0xb400ff);

// Wireframe core
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.6, 1),
  new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.55 })
);
scene.add(core);

// Inner glowing sphere
const inner = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.1, 3),
  new THREE.MeshBasicMaterial({ color: violet, wireframe: true, transparent: true, opacity: 0.25 })
);
scene.add(inner);

// Orbit rings
const rings = [];
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.6 + i * 0.5, 0.012, 8, 160),
    new THREE.MeshBasicMaterial({ color: i % 2 ? violet : accent, transparent: true, opacity: 0.5 })
  );
  ring.rotation.x = Math.PI / 2.4 + i * 0.4;
  ring.rotation.y = i * 0.7;
  scene.add(ring);
  rings.push(ring);
}

// Starfield
const COUNT = 1800;
const positions = new Float32Array(COUNT * 3);
for (let i = 0; i < COUNT; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 30;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.7 })
);
scene.add(stars);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

// Mouse parallax + scroll-driven camera
const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

let scrollY = window.scrollY;
window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

let visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const t = clock.getElapsedTime();
  const scrollFactor = scrollY / window.innerHeight;

  if (!reduceMotion) {
    core.rotation.x = t * 0.15 + mouse.y * 0.3;
    core.rotation.y = t * 0.2 + mouse.x * 0.3;
    inner.rotation.y = -t * 0.25;
    rings.forEach((r, i) => { r.rotation.z = t * (0.1 + i * 0.05); });
    stars.rotation.y = t * 0.02;
  }

  camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.04;
  camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.04;
  camera.position.z = 6 + scrollFactor * 1.5;
  camera.lookAt(0, 0, 0);

  // Core pulses slightly and drifts away as you scroll
  const pulse = reduceMotion ? 1 : 1 + Math.sin(t * 2) * 0.03;
  core.scale.setScalar(pulse);
  core.position.y = -scrollFactor * 0.8;
  inner.position.y = core.position.y;

  renderer.render(scene, camera);
}
frame();
