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
    <h3>${e.role.toUpperCase()}</h3>
    <div class="meta">${e.company} · ${e.period}</div>
    ${e.points.length ? `<ul>${e.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
    ${e.skills ? `<p class="skills-line">${e.skills}</p>` : ''}
  </li>`).join('');

document.getElementById('education-list').innerHTML = education.map((e) => `
  <li>
    <h3>${e.school.toUpperCase()}</h3>
    <div class="meta">${e.period}</div>
    <p>${e.degree}</p>
    ${e.detail ? `<p class="skills-line">${e.detail}</p>` : ''}
  </li>`).join('');

document.getElementById('cards').innerHTML = projects.map((p) => `
  <article class="card">
    <a class="overlay" href="${p.url}" target="_blank" rel="noopener" aria-label="${p.name} on GitHub"></a>
    <h3>${p.name.toUpperCase()}</h3>
    <p>${p.desc}</p>
    <div class="card-meta"><span>${p.lang}</span>${p.live ? `<a class="live" href="${p.live}" target="_blank" rel="noopener">LIVE ↗</a>` : `<span>★ ${p.stars}</span>`}</div>
  </article>`).join('');

/* ---------- Three.js scene ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 4, 17);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(4, 10, 6);
scene.add(sun);

const PALETTE = [0x06d6a0, 0x118ab2, 0x073b4c, 0xffd166, 0xef476f];

/* 1) Voxel terrain: a grid of cubes whose heights ripple */
const GRID = 34;
const terrainGeo = new THREE.BoxGeometry(0.9, 1, 0.9);
const terrainMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 });
const terrain = new THREE.InstancedMesh(terrainGeo, terrainMat, GRID * GRID);
const dummy = new THREE.Object3D();
const tint = new THREE.Color();
let idx = 0;
for (let i = 0; i < GRID; i++) {
  for (let j = 0; j < GRID; j++) {
    dummy.position.set(i - GRID / 2, -5, j - GRID / 2 - 6);
    dummy.updateMatrix();
    terrain.setMatrixAt(idx, dummy.matrix);
    tint.set(PALETTE[(i + j) % 3]); // only the three greens and blues
    terrain.setColorAt(idx, tint);
    idx++;
  }
}
scene.add(terrain);

/* 2) Voxel "HC" logo: cubes fly in from scattered spots and snap into place */
const C_ROWS = ['01111', '10000', '10000', '10000', '01111'];
const logoGroup = new THREE.Group();
logoGroup.position.set(0.6, 4.2, 0);
logoGroup.scale.setScalar(0.7);
scene.add(logoGroup);
const voxelGeo = new THREE.BoxGeometry(0.62, 0.62, 0.62);
const voxels = [];
function addGlyph(rows, xOffset, color) {
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch !== '1') return;
      const target = new THREE.Vector3((c + xOffset) * 0.7 - 2.6, (2 - r) * 0.7, 0);
      const start = new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6);
      const mesh = new THREE.Mesh(voxelGeo, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8 }));
      mesh.position.copy(start);
      logoGroup.add(mesh);
      voxels.push({ mesh, start, target, delay: Math.random() * 0.8 });
    });
  });
}
const H_ROWS = ['10001', '10001', '11111', '10001', '10001'];
addGlyph(H_ROWS, 0, 0xffd166);
addGlyph(C_ROWS, 6, 0xef476f);

/* 3) Project coins: pixel cubes that spin, bob, and lift on hover. Click opens the repo. */
const coins = [];
const coinGroup = new THREE.Group();
coinGroup.position.set(0, -1.2, 0);
scene.add(coinGroup);
projects.forEach((p, i) => {
  const x = (i - (projects.length - 1) / 2) * 2.4;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.1, 1.1),
    new THREE.MeshStandardMaterial({ color: PALETTE[(i + 2) % PALETTE.length], flatShading: true, roughness: 0.6 })
  );
  mesh.position.set(x, 0, 0);
  mesh.userData = { name: p.name, url: p.url, baseX: x, phase: i * 0.9, lift: 0 };
  coinGroup.add(mesh);
  coins.push(mesh);
});

/* ---------- Pointer: hover label, click opens repo ---------- */
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
window.addEventListener('click', (e) => {
  if (e.target.closest('a, button, .box, .card')) return;
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(coins, false)[0];
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
let visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const t = clock.getElapsedTime();

  // 1) Terrain ripple: each cube's height follows a travelling wave
  if (!reduceMotion) {
    let k = 0;
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const h = 0.6 + 0.5 * Math.sin(i * 0.45 + t * 1.6) + 0.4 * Math.cos(j * 0.5 - t * 1.1);
        dummy.position.set(i - GRID / 2, -5 + h * 0.5, j - GRID / 2 - 6);
        dummy.scale.set(1, 1 + h * 0.8, 1);
        dummy.updateMatrix();
        terrain.setMatrixAt(k++, dummy.matrix);
      }
    }
    terrain.instanceMatrix.needsUpdate = true;
  }

  // 2) Logo assembles: cubes fly in with a little overshoot, then the whole logo sways
  voxels.forEach((v) => {
    const p = reduceMotion ? 1 : Math.min(Math.max((t - v.delay) / 1.6, 0), 1);
    const eased = 1 - Math.pow(1 - p, 3) + Math.sin(p * Math.PI) * 0.15;
    v.mesh.position.lerpVectors(v.start, v.target, eased);
    v.mesh.rotation.x = (1 - p) * 4;
    v.mesh.rotation.y = (1 - p) * 3;
  });
  logoGroup.rotation.y = reduceMotion ? 0 : Math.sin(t * 0.6) * 0.35;

  // 3) Coins spin and bob; the hovered coin lifts and turns faster
  coins.forEach((c) => {
    const { phase } = c.userData;
    const target = c === hovered ? 0.9 : 0;
    c.userData.lift += (target - c.userData.lift) * 0.15;
    c.position.y = reduceMotion ? 0 : Math.sin(t * 1.4 + phase) * 0.2 + c.userData.lift;
    c.rotation.y = reduceMotion ? 0 : t * (c === hovered ? 3 : 1.2) + phase;
    c.rotation.x = reduceMotion ? 0 : Math.sin(t * 0.8 + phase) * 0.25;
  });

  if (finePointer && !reduceMotion) {
    ray.setFromCamera(pointer, camera);
    hovered = ray.intersectObjects(coins, false)[0]?.object ?? null;
    document.body.style.cursor = hovered ? 'pointer' : '';
    if (hovered) {
      label.textContent = hovered.userData.name.toUpperCase() + ' ▶';
      label.classList.add('on');
    } else {
      label.classList.remove('on');
    }
  }

  renderer.render(scene, camera);
}
frame();
