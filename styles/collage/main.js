import * as THREE from 'three';
import { profile, experience, education, projects, skills } from '../../data.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* ---------- Content ---------- */
document.getElementById('about-text').textContent = profile.about;
document.getElementById('linkedin').href = profile.linkedin;
document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById('timeline').innerHTML = experience.map((e) => `
  <li class="reveal">
    <h3>${e.role} · ${e.company}</h3>
    <div class="meta">${e.period}</div>
    ${e.points.length ? `<ul>${e.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
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
  <article class="card">
    <a class="overlay" href="${p.url}" target="_blank" rel="noopener" aria-label="${p.name} on GitHub"></a>
    <h3>${p.name}</h3>
    <p>${p.desc}</p>
    <div class="card-meta"><span>${p.lang}</span>${p.live ? `<a class="live" href="${p.live}" target="_blank" rel="noopener">Live ↗</a>` : `<span>★ ${p.stars}</span>`}</div>
  </article>`).join('');

document.getElementById('chips').innerHTML = skills.map((s) => `<span class="chip">${s}</span>`).join('');

/* ---------- Typed role line ---------- */
const roles = ['Backend Developer', 'DevOps Engineer', 'Payments & APIs', 'Cloud on AWS'];
const typedEl = document.getElementById('typed');
if (reduceMotion) {
  typedEl.textContent = roles[0];
} else {
  let r = 0, c = 0, deleting = false;
  const step = () => {
    const word = roles[r];
    c += deleting ? -1 : 1;
    typedEl.textContent = word.slice(0, c);
    let delay = deleting ? 45 : 90;
    if (!deleting && c === word.length) { delay = 1600; deleting = true; }
    else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; delay = 300; }
    setTimeout(step, delay);
  };
  step();
}

/* ---------- Reveal + counters ---------- */
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('in');
    entry.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(entry.target);
  }
}, { threshold: 0.2 });
document.querySelectorAll('.reveal, [data-count]').forEach((el) => io.observe(el));

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

/* ---------- Cursor spotlight ---------- */
const glow = document.querySelector('.cursor-glow');
if (finePointer && !reduceMotion) {
  window.addEventListener('pointermove', (e) => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });
} else {
  glow.style.display = 'none';
}

/* ---------- Three.js scene ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xf3ead6, 0.03);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

const INK = 0x1d1b2f;
const PALETTE = [0xe8473f, 0x3fb6a8, 0xf2b533, 0xf7a8c4, 0x3d5afe];

// Project cubes: a loose ring of tumbling blocks, one per project. Hover shows label, click opens repo.
const cubes = [];
const cubeGroup = new THREE.Group();
scene.add(cubeGroup);
projects.forEach((p, i) => {
  const a = (i / projects.length) * Math.PI * 2;
  const base = new THREE.Vector3(Math.cos(a) * 5.5, 0.4 * Math.sin(a * 2), Math.sin(a) * 5.5);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.MeshBasicMaterial({ color: PALETTE[i % PALETTE.length], transparent: true, opacity: 0.9 })
  );
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: INK })));
  mesh.position.copy(base);
  mesh.userData = { name: p.name, url: p.url, base: base.clone(), phase: i };
  cubeGroup.add(mesh);
  cubes.push(mesh);
});

// Rippling dot-wave floor, drawn in ink
const waveGeo = new THREE.PlaneGeometry(44, 26, 110, 60);
waveGeo.rotateX(-Math.PI / 2);
const wavePos = waveGeo.attributes.position;
const waveBase = Float32Array.from(wavePos.array);
const wave = new THREE.Points(
  waveGeo,
  new THREE.PointsMaterial({ color: INK, size: 0.07, transparent: true, opacity: 0.45 })
);
wave.position.y = -4;
scene.add(wave);

/* ---------- Camera path driven by scroll ---------- */
// One keypoint per chapter: camera position + look-at target
const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2, 1, 17),     // 00 hero (cubes sit behind the text)
  new THREE.Vector3(-5, 1.2, 6),    // 01 about
  new THREE.Vector3(3, -0.6, 16),   // 02 career (highlighted, outside the orb ring)
  new THREE.Vector3(0, 3.2, 12),    // 03 builds
  new THREE.Vector3(-3, 0, 7),      // 04 education
  new THREE.Vector3(0, 0, 5),       // 05 contact
]);
const lookPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(-2, 0, 0),
  new THREE.Vector3(0, 0, -6),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(-2, 0, -2),
  new THREE.Vector3(0, 0, -2),
]);

const chapters = [...document.querySelectorAll('.chapter')];
let progress = 0; // 0..1 across chapters, float
function computeProgress() {
  const y = window.scrollY + window.innerHeight * 0.5;
  let idx = 0;
  for (let i = 0; i < chapters.length; i++) {
    const top = chapters[i].offsetTop;
    if (y >= top) idx = i;
  }
  const top = chapters[idx].offsetTop;
  const h = chapters[idx].offsetHeight;
  const frac = Math.min(Math.max((y - top) / h, 0), 1);
  return { idx, t: (idx + frac) / (chapters.length - 1) };
}

// HUD
const hudLinks = [...document.querySelectorAll('.hud-list a')];
const hudIndex = document.getElementById('hud-index');
const hudBar = document.getElementById('hud-bar');
function updateHud(idx, t) {
  hudIndex.textContent = `0${idx} / 0${chapters.length - 1}`;
  hudLinks.forEach((a, i) => a.classList.toggle('active', i === idx));
  hudBar.style.height = `${Math.min(Math.max(t, 0), 1) * 100}%`;
}

/* ---------- Cube hover + click ---------- */
const label = document.getElementById('orb-label');
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2(9, 9);
let hovered = null;
if (finePointer) {
  window.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    label.style.left = e.clientX + 'px';
    label.style.top = e.clientY + 'px';
  });
}
// Clicks on empty space reach the scene; check which cube (if any) is under the cursor
window.addEventListener('click', (e) => {
  if (e.target.closest('a, button, .glass, .card')) return;
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(cubes, false)[0];
  if (hit) window.open(hit.object.userData.url, '_blank', 'noopener');
});

/* ---------- Resize + loop ---------- */
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
resize();
addEventListener('resize', resize);

const clock = new THREE.Clock();
const camPos = new THREE.Vector3();
const lookAt = new THREE.Vector3();
let visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const t = clock.getElapsedTime();

  const { idx, t: p } = computeProgress();
  progress += (p - progress) * 0.08;
  updateHud(idx, progress);

  if (reduceMotion) {
    camera.position.set(-2, 1, 17);
    camera.lookAt(0, 0, 0);
  } else {
    path.getPoint(progress, camPos);
    lookPath.getPoint(progress, lookAt);
    camera.position.lerp(camPos, 0.12);
    camera.lookAt(lookAt);

    cubes.forEach((c) => {
      const { base, phase } = c.userData;
      c.position.y = base.y + Math.sin(t * 1.2 + phase) * 0.25;
      c.rotation.x = t * 0.35 + phase;
      c.rotation.y = t * 0.45 + phase * 0.7;
    });
    cubeGroup.rotation.y = t * 0.05;

    for (let i = 0; i < wavePos.count; i++) {
      const x = waveBase[i * 3];
      const z = waveBase[i * 3 + 2];
      wavePos.array[i * 3 + 1] = Math.sin(x * 0.35 + t * 0.9) * 0.6 + Math.cos(z * 0.45 - t * 0.7) * 0.4;
    }
    wavePos.needsUpdate = true;
  }

  // Hover detection on cubes
  if (finePointer && !reduceMotion) {
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(cubes, false);
    hovered = hits.length ? hits[0].object : null;
    document.body.style.cursor = hovered ? 'pointer' : '';
    if (hovered) {
      label.textContent = hovered.userData.name + ' →';
      label.classList.add('on');
    } else {
      label.classList.remove('on');
    }
  }

  renderer.render(scene, camera);
}
frame();
