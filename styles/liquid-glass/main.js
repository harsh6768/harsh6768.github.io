import * as THREE from 'three';
import { profile, experience, education, projects, skills } from '../../data.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* ---------- Content ---------- */
document.getElementById('about-text').textContent = profile.about;
document.getElementById('linkedin').href = profile.linkedin;
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('chips').innerHTML = skills.map((s) => `<span class="chip">${s}</span>`).join('');

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

/* ---------- Three.js setup ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const BLOB_X = 3.2;

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const key = new THREE.DirectionalLight(0xffffff, 1.4);
key.position.set(-4, 6, 6);
scene.add(key);
const tealLight = new THREE.PointLight(0x7cf2e0, 14, 20);
tealLight.position.set(4, -2, 4);
scene.add(tealLight);
const pinkLight = new THREE.PointLight(0xff9ad5, 12, 20);
pinkLight.position.set(-3, 3, 5);
scene.add(pinkLight);

/* 1) Liquid glass blob: a sphere whose surface ripples like a drop of liquid.
   Each vertex is pushed in and out along its own direction; the pointer squashes it. */
const blobGeo = new THREE.IcosahedronGeometry(1.9, 42);
const blobBase = Float32Array.from(blobGeo.attributes.position.array);
const blobPos = blobGeo.attributes.position;
const blob = new THREE.Mesh(
  blobGeo,
  new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.38, roughness: 0.06, metalness: 0,
    emissive: 0x6d5bff, emissiveIntensity: 0.12, depthWrite: false,
  })
);
blob.position.set(BLOB_X, 0, 0);
scene.add(blob);
// A second, smaller core inside gives the glass some depth
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.1, 12),
  new THREE.MeshStandardMaterial({ color: 0xd8f7ff, transparent: true, opacity: 0.25, roughness: 0.2, emissive: 0x3fd8c8, emissiveIntensity: 0.25, depthWrite: false })
);
core.position.copy(blob.position);
scene.add(core);

/* 2) Aurora ribbons: glowing rings that flow around the blob at different tilts */
const ribbons = [];
[
  { r: 3.1, tube: 0.05, color: 0x7cf2e0, tilt: [1.1, 0.2, 0], speed: 0.25 },
  { r: 3.5, tube: 0.04, color: 0xff9ad5, tilt: [0.4, 0.9, 0.3], speed: -0.18 },
  { r: 2.8, tube: 0.035, color: 0x9d8cff, tilt: [-0.6, 0.3, 1.0], speed: 0.32 },
].forEach((cfg) => {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(cfg.r, cfg.tube, 14, 220),
    new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.7, depthWrite: false })
  );
  mesh.position.copy(blob.position);
  mesh.rotation.set(cfg.tilt[0], cfg.tilt[1], cfg.tilt[2]);
  mesh.userData.speed = cfg.speed;
  scene.add(mesh);
  ribbons.push(mesh);
});

/* Pointer: the blob leans toward the cursor and squashes a little */
const pointer = new THREE.Vector2(0, 0);
const lean = new THREE.Vector2(0, 0);
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

/* 3) Scroll: the camera swings around the blob and the colour field drifts */
let scrollT = 0;
function scrollProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;
}

const clock = new THREE.Clock();
let visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const t = clock.getElapsedTime();

  scrollT += (scrollProgress() - scrollT) * 0.08;
  const orbit = reduceMotion ? 0 : scrollT * Math.PI * 0.7;
  camera.position.set(
    Math.sin(orbit) * 1.2 + lean.x * 0.4,
    0.4 + lean.y * 0.3,
    9
  );
  camera.lookAt(BLOB_X - 0.8, 0, 0);
  document.documentElement.style.setProperty('--shift', scrollT.toFixed(3));

  // Blob morph: ripple every vertex from its base direction, then squash toward the pointer
  lean.x += ((reduceMotion ? 0 : pointer.x) - lean.x) * 0.05;
  lean.y += ((reduceMotion ? 0 : pointer.y) - lean.y) * 0.05;
  for (let i = 0; i < blobPos.count; i++) {
    const x = blobBase[i * 3], y = blobBase[i * 3 + 1], z = blobBase[i * 3 + 2];
    const ripple = reduceMotion ? 0 : 0.1 * Math.sin(x * 2.2 + t * 1.4) * Math.cos(y * 2.0 - t * 1.1) + 0.05 * Math.sin(z * 3.0 + t * 1.9);
    const k = 1 + ripple;
    // Squash along the pointer direction, so the drop bulges toward the cursor
    const squash = 1 + lean.x * (x > 0 ? 0.08 : -0.04);
    blobPos.array[i * 3] = x * k * squash;
    blobPos.array[i * 3 + 1] = y * k * (1 - lean.y * 0.05);
    blobPos.array[i * 3 + 2] = z * k;
  }
  blobPos.needsUpdate = true;
  blobGeo.computeVertexNormals();
  core.scale.setScalar(1 + (reduceMotion ? 0 : Math.sin(t * 1.3) * 0.05));
  core.rotation.y = t * 0.2;

  // Aurora ribbons flow around the blob at their own speeds
  ribbons.forEach((r) => {
    if (!reduceMotion) r.rotation.z += r.userData.speed * 0.01;
    r.material.opacity = 0.55 + Math.sin(t * 1.2 + r.userData.speed * 10) * 0.2;
  });

  // Lights travel slowly so the glass highlights move
  tealLight.position.x = 4 + Math.sin(t * 0.5) * 2;
  pinkLight.position.y = 3 + Math.cos(t * 0.4) * 2;

  renderer.render(scene, camera);
}
frame();
