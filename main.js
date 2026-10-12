import * as THREE from 'three';
import { profile, experience, education, projects, skills } from './data.js';

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
scene.fog = new THREE.FogExp2(0x04050b, 0.045);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

const HOT = new THREE.Color(0xff3d7f);
const CYAN = new THREE.Color(0x29f0ff);
const LIME = new THREE.Color(0xb6ff3b);

// Core: Fibonacci sphere of points + wireframe shell
const core = new THREE.Group();
const CORE_N = 900;
const corePos = new Float32Array(CORE_N * 3);
for (let i = 0; i < CORE_N; i++) {
  const y = 1 - (i / (CORE_N - 1)) * 2;
  const rad = Math.sqrt(1 - y * y);
  const th = i * Math.PI * (3 - Math.sqrt(5));
  corePos.set([Math.cos(th) * rad * 2.2, y * 2.2, Math.sin(th) * rad * 2.2], i * 3);
}
const coreGeo = new THREE.BufferGeometry();
coreGeo.setAttribute('position', new THREE.BufferAttribute(corePos, 3));
core.add(new THREE.Points(coreGeo, new THREE.PointsMaterial({ color: CYAN, size: 0.05, transparent: true, opacity: 0.9 })));
core.add(new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.5, 2),
  new THREE.MeshBasicMaterial({ color: HOT, wireframe: true, transparent: true, opacity: 0.25 })
));
scene.add(core);

// Orbit rings around the core
const rings = [];
[2.9, 3.6, 4.4].forEach((radius, i) => {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.008, 6, 200),
    new THREE.MeshBasicMaterial({ color: i === 1 ? LIME : CYAN, transparent: true, opacity: 0.45 })
  );
  ring.rotation.set(Math.PI / 2.3 + i * 0.35, i * 0.6, 0);
  scene.add(ring);
  rings.push(ring);
});

// Project orbs on a wide ring; hover shows label, click opens repo
const orbs = [];
const orbGroup = new THREE.Group();
scene.add(orbGroup);
projects.forEach((p, i) => {
  const a = (i / projects.length) * Math.PI * 2;
  const pos = new THREE.Vector3(Math.cos(a) * 8, Math.sin(a * 2) * 1.2, Math.sin(a) * 8);
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 32, 32),
    new THREE.MeshBasicMaterial({ color: i % 2 ? HOT : CYAN, transparent: true, opacity: 0.9 })
  );
  orb.position.copy(pos);
  orb.userData = { name: p.name, url: p.url, base: pos.clone() };
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.66, 48),
    new THREE.MeshBasicMaterial({ color: CYAN, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  halo.position.copy(pos);
  orbGroup.add(orb, halo);
  orbs.push({ mesh: orb, halo });
});

// Experience spine: a helix of nodes on the right
const spine = new THREE.Group();
experience.forEach((_, i) => {
  const t = i / Math.max(experience.length - 1, 1);
  const node = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22),
    new THREE.MeshBasicMaterial({ color: LIME, wireframe: true })
  );
  node.position.set(Math.cos(t * 6) * 1.3 + 9, 4 - t * 8, Math.sin(t * 6) * 1.3 - 6);
  spine.add(node);
});
scene.add(spine);

// Starfield + floor grid for depth
const starCount = 1600;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos.set([(Math.random() - 0.5) * 120, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 120], i * 3);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.6 })));

const grid = new THREE.GridHelper(120, 60, 0x29f0ff, 0x1a2350);
grid.position.y = -5;
grid.material.transparent = true;
grid.material.opacity = 0.35;
scene.add(grid);

/* ---------- Camera path driven by scroll ---------- */
// One keypoint per chapter: camera position + look-at target
const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-3.2, 0.6, 10),  // 00 hero (core sits right of the text)
  new THREE.Vector3(-5, 1.2, 6),    // 01 about
  new THREE.Vector3(3, -0.6, 7),    // 02 career
  new THREE.Vector3(0, 3.2, 12),    // 03 builds
  new THREE.Vector3(0, 0, 5),       // 04 contact
]);
const lookPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(-2, 0, 0),
  new THREE.Vector3(5, 0, -4),
  new THREE.Vector3(0, 0, 0),
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

/* ---------- Orb hover + click ---------- */
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
canvas.addEventListener('click', () => {
  if (hovered) window.open(hovered.userData.url, '_blank', 'noopener');
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
    camera.position.set(-3.2, 0.6, 10);
    camera.lookAt(0, 0, 0);
  } else {
    path.getPoint(progress, camPos);
    lookPath.getPoint(progress, lookAt);
    camera.position.lerp(camPos, 0.12);
    camera.lookAt(lookAt);

    core.rotation.y = t * 0.12;
    core.rotation.x = Math.sin(t * 0.2) * 0.1;
    core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03);
    rings.forEach((r, i) => { r.rotation.z = t * (0.08 + i * 0.04); });
    spine.rotation.y = t * 0.1;
    orbs.forEach(({ mesh, halo }, i) => {
      const bob = Math.sin(t * 1.2 + i) * 0.15;
      mesh.position.y = mesh.userData.base.y + bob;
      halo.position.y = mesh.position.y;
      halo.lookAt(camera.position);
    });
    orbGroup.rotation.y = t * 0.04;
  }

  // Hover detection on orbs
  if (finePointer && !reduceMotion) {
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(orbs.map((o) => o.mesh), false);
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
