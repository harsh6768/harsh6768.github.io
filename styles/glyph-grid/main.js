import * as THREE from 'three';
import { profile, experience, education, projects, skills } from '../../data.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* ---------- Content ---------- */
document.getElementById('about-text').textContent = profile.about;
document.getElementById('linkedin').href = profile.linkedin;
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('chips').innerHTML = skills.map((s) => `<span class="chip">${s.toUpperCase()}</span>`).join('');

document.getElementById('timeline').innerHTML = experience.map((e) => `
  <li>
    <h3>${e.role} · ${e.company}</h3>
    <div class="meta">${e.period}</div>
    ${e.points.length ? `<ul>${e.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
    ${e.skills ? `<p class="skills-line">${e.skills}</p>` : ''}
  </li>`).join('');

document.getElementById('education-list').innerHTML = education.map((e) => `
  <li>
    <h3>${e.school}</h3>
    <div class="meta">${e.period}</div>
    <p>${e.degree}</p>
    ${e.detail ? `<p class="skills-line">${e.detail}</p>` : ''}
  </li>`).join('');

document.getElementById('cards').innerHTML = projects.map((p) => `
  <article class="card">
    <a class="overlay" href="${p.url}" target="_blank" rel="noopener" aria-label="${p.name} on GitHub"></a>
    <h3>${p.name}</h3>
    <p>${p.desc}</p>
    <div class="card-meta"><span>${p.lang}</span>${p.live ? `<a class="live" href="${p.live}" target="_blank" rel="noopener">Live ↗</a>` : `<span>★ ${p.stars}</span>`}</div>
  </article>`).join('');

/* ---------- Glyph atlas: eight shapes, each drawn to its own texture ---------- */
const GLYPHS = ['circle', 'square', 'triangle', 'cross', 'plus', 'diamond', 'half', 'ring'];
function drawGlyph(kind) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 14;
  const m = 22, s = 128 - m * 2;
  g.beginPath();
  switch (kind) {
    case 'circle': g.arc(64, 64, s / 2, 0, Math.PI * 2); g.fill(); break;
    case 'square': g.fillRect(m, m, s, s); break;
    case 'triangle': g.moveTo(64, m); g.lineTo(128 - m, 128 - m); g.lineTo(m, 128 - m); g.closePath(); g.fill(); break;
    case 'cross': g.moveTo(m, m); g.lineTo(128 - m, 128 - m); g.moveTo(128 - m, m); g.lineTo(m, 128 - m); g.stroke(); break;
    case 'plus': g.moveTo(64, m); g.lineTo(64, 128 - m); g.moveTo(m, 64); g.lineTo(128 - m, 64); g.stroke(); break;
    case 'diamond': g.moveTo(64, m); g.lineTo(128 - m, 64); g.lineTo(64, 128 - m); g.lineTo(m, 64); g.closePath(); g.fill(); break;
    case 'half': g.arc(64, 64, s / 2, Math.PI, 0); g.closePath(); g.fill(); break;
    case 'ring': g.arc(64, 64, s / 2, 0, Math.PI * 2); g.stroke(); break;
  }
  return new THREE.CanvasTexture(c);
}

/* ---------- Three.js setup ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 0, 18);

const COLS = 40, ROWS = 26, SPACING = 1.0, TILE = 0.82;
const COBALT = 0x2b59ff, INK = 0x111111;
const meshes = GLYPHS.map((name, gi) => {
  const mat = new THREE.MeshBasicMaterial({
    map: drawGlyph(name), transparent: true, alphaTest: 0.05, depthWrite: false,
    color: gi % 2 ? INK : COBALT, opacity: gi % 2 ? 0.55 : 0.85,
  });
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(TILE, TILE), mat, COLS * ROWS);
  mesh.count = 0;
  scene.add(mesh);
  return mesh;
});

// Tile base positions, kept so each frame can recompute the field
const tiles = [];
for (let i = 0; i < COLS; i++) {
  for (let j = 0; j < ROWS; j++) {
    tiles.push({ x: (i - COLS / 2 + 0.5) * SPACING, y: (j - ROWS / 2 + 0.5) * SPACING, seed: i * 0.37 + j * 0.11 });
  }
}

/* Pointer: a point on the z=0 plane that the ripple travels out from */
const pointer = new THREE.Vector2(9, 9);
const ripplePos = new THREE.Vector2(9, 9);
const ray = new THREE.Raycaster();
if (finePointer) {
  window.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  });
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
resize();
addEventListener('resize', resize);

let scrollT = 0;
function scrollProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;
}

const clock = new THREE.Clock();
let visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

const dummy = new THREE.Object3D();
// Clicks send a ring of motion outward from the click point
const clickPos = new THREE.Vector2(0, 0);
let clickT = -100;
window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('a, button, .cell, .card, .btn')) return;
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hp = new THREE.Vector3();
  if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hp)) {
    clickPos.set(hp.x, hp.y);
    clickT = clock.getElapsedTime();
  }
});

function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const t = clock.getElapsedTime();

  // Where the pointer lands on the field
  if (finePointer) {
    ray.setFromCamera(pointer, camera);
    const hitPoint = new THREE.Vector3();
    if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hitPoint)) {
      ripplePos.set(hitPoint.x, hitPoint.y);
    }
  }
  scrollT += (scrollProgress() - scrollT) * 0.1;

  const counts = new Array(GLYPHS.length).fill(0);
  tiles.forEach((tile) => {
    const { x, y, seed } = tile;
    // 1) Wave flip: tiles rotate in a travelling wave
    const wave = reduceMotion ? 0 : Math.sin(x * 0.28 + t * 1.2) * Math.cos(y * 0.3 - t * 0.9);
    // 2) Ripple: tiles near the cursor swell and turn, the ripple rings outward
    const d = Math.hypot(x - ripplePos.x, y - ripplePos.y);
    const age = t - clickT;
    const dc = Math.hypot(x - clickPos.x, y - clickPos.y);
    const ring = age < 3 && !reduceMotion ? Math.exp(-Math.pow(dc - age * 6, 2) * 0.8) * Math.exp(-age * 1.2) * 1.6 : 0;
    const ripple = reduceMotion ? 0 : Math.exp(-d * 0.35) * Math.sin(d * 2.4 - t * 6) + ring;
    // 3) Scroll morph: the glyph shape changes as the page scrolls
    const gi = ((Math.floor(seed * 7 + scrollT * 24 + wave * 1.5) % GLYPHS.length) + GLYPHS.length) % GLYPHS.length;

    dummy.position.set(x, y, ripple * 0.6);
    dummy.rotation.set(wave * 0.9 + ripple * 0.5, wave * 0.5, wave * 0.4 + ripple * 0.7);
    dummy.scale.setScalar(1 + ripple * 0.35);
    dummy.updateMatrix();
    meshes[gi].setMatrixAt(counts[gi]++, dummy.matrix);
  });

  meshes.forEach((mesh, gi) => {
    mesh.count = counts[gi];
    mesh.instanceMatrix.needsUpdate = true;
  });

  // Gentle camera drift with the pointer
  // Scroll pushes the camera in, so the field feels like it moves past you
  camera.position.z += ((reduceMotion ? 18 : 18 - scrollT * 5) - camera.position.z) * 0.1;
  camera.position.x += ((finePointer ? pointer.x * 0.6 : 0) - camera.position.x) * 0.04;
  camera.position.y += ((finePointer ? pointer.y * 0.4 : 0) - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}
frame();

/* ---------- Page interactions ---------- */
// Reveal sections and their children in sequence as they enter the screen
const revealTargets = document.querySelectorAll('.cell > *');
revealTargets.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${(i % 4) * 90}ms`;
});
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('in'); revealIO.unobserve(entry.target); }
  });
}, { threshold: 0.12 });
revealTargets.forEach((el) => revealIO.observe(el));

// Active nav link follows the section in view
const navLinks = new Map([...document.querySelectorAll('[data-nav]')].map((a) => [a.dataset.nav, a]));
const navIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.remove('active'));
    navLinks.get(entry.target.id)?.classList.add('active');
  });
}, { rootMargin: '-45% 0px -45% 0px' });
['about', 'career', 'builds', 'contact'].forEach((id) => navIO.observe(document.getElementById(id)));

// Reading progress bar
const progressEl = document.getElementById('progress');
addEventListener('scroll', () => { progressEl.style.transform = `scaleX(${scrollProgress()})`; }, { passive: true });

// Role line types and rotates through a few titles
const roles = ['Backend Developer', 'DevOps Engineer', 'Payments & APIs', 'Cloud on AWS'];
const roleEl = document.getElementById('role');
if (reduceMotion) {
  roleEl.textContent = roles[0];
} else {
  let r = 0, c = roles[0].length, deleting = true;
  const typeStep = () => {
    const word = roles[r];
    c += deleting ? -1 : 1;
    roleEl.textContent = word.slice(0, c);
    let delay = deleting ? 40 : 80;
    if (!deleting && c === word.length) { delay = 1800; deleting = true; }
    else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; delay = 250; }
    setTimeout(typeStep, delay);
  };
  setTimeout(typeStep, 1200);
}

// Cursor spotlight
const spot = document.getElementById('spot');
if (finePointer && !reduceMotion) {
  addEventListener('pointermove', (e) => { spot.style.left = e.clientX + 'px'; spot.style.top = e.clientY + 'px'; });
} else {
  spot.style.display = 'none';
}

// Magnetic buttons: lean toward the cursor while it is near
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.25;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}
