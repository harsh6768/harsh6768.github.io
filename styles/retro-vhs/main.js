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
    <h3>${e.role.toUpperCase()} · ${e.company}</h3>
    <div class="meta">${e.period}</div>
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

/* ---------- Three.js setup ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
camera.position.set(0, 1, 12);
const aim = new THREE.Vector3(0, 0, 0);

const MAGENTA = 0xff2a95, CYAN = 0x00e5ff, YELLOW = 0xffe066;
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(-4, 6, 8);
scene.add(sun);

/* ---------- 1) CRT TV: static that spikes when you scroll (like changing channels) ---------- */
const tv = new THREE.Group();
tv.position.set(3.4, 0.6, 0);
scene.add(tv);
tv.add(new THREE.Mesh(new THREE.BoxGeometry(4, 3, 2.4), new THREE.MeshStandardMaterial({ color: 0x2b0a3d, roughness: 0.7 })));
const noiseCanvas = document.createElement('canvas');
noiseCanvas.width = 160; noiseCanvas.height = 120;
const noiseCtx = noiseCanvas.getContext('2d');
const noiseTex = new THREE.CanvasTexture(noiseCanvas);
const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshBasicMaterial({ map: noiseTex, toneMapped: false }));
screen.position.set(0, 0.1, 1.21);
tv.add(screen);
const stand = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 1.2), new THREE.MeshStandardMaterial({ color: 0x1a0a2e }));
stand.position.set(0, -1.67, 0);
tv.add(stand);
const tvGlow = new THREE.PointLight(MAGENTA, 6, 12);
tvGlow.position.set(0, 0, 3);
tv.add(tvGlow);

let staticBurst = 0; // spikes with scroll speed, decays back to a calm picture
function paintStatic(t, burst) {
  const w = noiseCanvas.width, h = noiseCanvas.height;
  const img = noiseCtx.createImageData(w, h);
  const bar = Math.floor((t * 60) % h); // rolling tracking bar
  const noise = 0.25 + burst * 0.75;    // more snow during a channel change
  for (let y = 0; y < h; y++) {
    const bright = y === bar || y === (bar + 1) % h ? 120 : 0;
    for (let x = 0; x < w; x++) {
      const v = Math.random() * 180 * noise + bright;
      const i = (y * w + x) * 4;
      img.data[i] = v * 0.8; img.data[i + 1] = v * 0.4; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
  }
  noiseCtx.putImageData(img, 0, 0);
  noiseTex.needsUpdate = true;
}

/* ---------- 2) Synthwave grid: horizon fades into fog, speed follows scroll ---------- */
const GRID_Z_MIN = -60, GRID_Z_MAX = 0, GRID_ROWS = 26;
const gridRows = [];
for (let i = 0; i < GRID_ROWS; i++) {
  const mat = new THREE.LineBasicMaterial({ color: MAGENTA, transparent: true, opacity: 0.6 });
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-40, 0, 0), new THREE.Vector3(40, 0, 0)]), mat);
  line.userData.z = GRID_Z_MIN + (i / GRID_ROWS) * (GRID_Z_MAX - GRID_Z_MIN);
  scene.add(line);
  gridRows.push(line);
}
const colGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, GRID_Z_MIN), new THREE.Vector3(0, 0, GRID_Z_MAX)]);
for (let x = -30; x <= 30; x += 3) {
  const col = new THREE.Line(colGeo, new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.35 }));
  col.position.set(x, -3.4, 0);
  scene.add(col);
}

// Sun with a pulsing halo
const sunCanvas = document.createElement('canvas');
sunCanvas.width = 256; sunCanvas.height = 256;
const sctx = sunCanvas.getContext('2d');
const grad = sctx.createLinearGradient(0, 0, 0, 256);
grad.addColorStop(0, '#ffe066'); grad.addColorStop(1, '#ff2a95');
sctx.fillStyle = grad; sctx.beginPath(); sctx.arc(128, 128, 128, 0, Math.PI * 2); sctx.fill();
sctx.fillStyle = '#0b0214';
for (let y = 150; y < 256; y += 16) sctx.fillRect(0, y, 256, 5 + (y - 150) / 12);
const sunTex = new THREE.CanvasTexture(sunCanvas);
const sunMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: sunTex, transparent: true }));
sunMesh.position.set(-3, 0.5, -45);
scene.add(sunMesh);
const halo = new THREE.Mesh(new THREE.CircleGeometry(7.5, 64), new THREE.MeshBasicMaterial({ color: YELLOW, transparent: true, opacity: 0.12 }));
halo.position.set(-3, 0.5, -46);
scene.add(halo);

/* ---------- 3) Cassettes: hover pulls forward and tilts toward you; click ejects, then opens ---------- */
const cassettes = [];
const cassetteGroup = new THREE.Group();
cassetteGroup.position.set(0, -2.2, 3);
scene.add(cassetteGroup);
const labelColors = ['#ff2a95', '#00e5ff', '#ffe066', '#b388ff', '#ff7a45', '#7CFC9A'];
projects.forEach((p, i) => {
  const x = (i - (projects.length - 1) / 2) * 2.6;
  const group = new THREE.Group();
  group.position.set(x, 0, 0);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.3), new THREE.MeshStandardMaterial({ color: 0x140624, roughness: 0.6 }));
  group.add(body);
  const lc = document.createElement('canvas');
  lc.width = 256; lc.height = 128;
  const lx = lc.getContext('2d');
  lx.fillStyle = labelColors[i % labelColors.length]; lx.fillRect(0, 0, 256, 128);
  lx.fillStyle = '#000'; lx.font = 'bold 30px monospace'; lx.textAlign = 'center';
  lx.fillText(p.name.toUpperCase().slice(0, 14), 128, 60);
  lx.font = '18px monospace'; lx.fillText('VHS · ' + p.lang.toUpperCase().slice(0, 12), 128, 96);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(lc) }));
  label.position.set(0, 0.12, 0.16);
  group.add(label);
  const reels = [];
  [-0.5, 0.5].forEach((rx) => {
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 18), new THREE.MeshStandardMaterial({ color: 0xf5e9ff, roughness: 0.4 }));
    reel.rotation.x = Math.PI / 2;
    reel.position.set(rx, -0.3, 0.2);
    group.add(reel);
    reels.push(reel);
  });
  group.userData = {
    url: p.url, name: p.name, body, reels, base: new THREE.Vector3(x, 0, 0),
    phase: i * 0.8, lift: 0, pull: 0, ejectT: -1,
  };
  cassetteGroup.add(group);
  cassettes.push(group);
});

/* ---------- Pointer, click, scroll ---------- */
const labelEl = document.getElementById('orb-label');
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2(9, 9);
const parallax = new THREE.Vector2(0, 0); // smoothed pointer offset for camera drift
let hovered = null;
if (finePointer) {
  window.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    labelEl.style.left = e.clientX + 'px';
    labelEl.style.top = e.clientY + 'px';
  });
}
const bodies = () => cassettes.map((c) => c.userData.body);
window.addEventListener('click', (e) => {
  if (e.target.closest('a, button, .panel, .card')) return;
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(bodies(), false)[0];
  if (!hit) return;
  const cassette = hit.object.parent;
  if (cassette.userData.ejectT >= 0) return; // already ejecting
  cassette.userData.ejectT = 0;
  setTimeout(() => window.open(cassette.userData.url, '_blank', 'noopener'), 650);
});

let lastScrollY = scrollY;
let scrollVel = 0;

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
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // Scroll speed: a smoothed value that drives grid speed and TV static
  const dy = scrollY - lastScrollY;
  lastScrollY = scrollY;
  scrollVel += (Math.min(Math.abs(dy), 120) / 120 - scrollVel) * 0.2;
  staticBurst = Math.max(staticBurst * 0.94, scrollVel);

  // Camera drifts with the pointer for depth
  parallax.x += (pointer.x * 0.6 - parallax.x) * 0.05;
  parallax.y += (pointer.y * 0.35 - parallax.y) * 0.05;
  camera.position.x = reduceMotion ? 0 : parallax.x;
  camera.position.y = (reduceMotion ? 1 : 1 + parallax.y);
  camera.lookAt(aim);

  // 1) TV
  paintStatic(t, reduceMotion ? 0 : staticBurst);
  if (!reduceMotion) {
    screen.material.opacity = 0.9 + Math.random() * 0.1;
    tv.position.y = 0.6 + Math.sin(t * 0.9) * 0.12;
    tv.rotation.y = Math.sin(t * 0.4) * 0.12 + parallax.x * -0.15;
  }

  // 2) Grid: faster on scroll, rows fade into the horizon
  const span = GRID_Z_MAX - GRID_Z_MIN;
  const speed = reduceMotion ? 0 : 3 + scrollVel * 18;
  gridRows.forEach((row) => {
    row.userData.z += speed * dt;
    if (row.userData.z > GRID_Z_MAX) row.userData.z -= span;
    row.position.set(0, -3.4, row.userData.z);
    row.material.opacity = 0.15 + 0.6 * ((row.userData.z - GRID_Z_MIN) / span);
  });
  halo.material.opacity = 0.08 + Math.sin(t * 1.5) * 0.04 + staticBurst * 0.1;
  sunMesh.position.y = 0.5 + Math.sin(t * 0.3) * 0.1;
  halo.position.y = sunMesh.position.y;

  // 3) Cassettes
  const hoverTarget = finePointer && !reduceMotion ? 1 : 0;
  cassettes.forEach((c) => {
    const d = c.userData;
    const isHover = c === hovered;
    d.lift += ((isHover ? 0.9 : 0) - d.lift) * 0.15;
    d.pull += ((isHover ? 1.2 : 0) - d.pull) * 0.12;
    if (reduceMotion) return;

    let ejectZ = 0, ejectSpin = 0, ejectY = 0;
    if (d.ejectT >= 0) {
      d.ejectT += dt;
      const p = Math.min(d.ejectT / 0.6, 1);
      const e = p * p * (3 - 2 * p); // ease in and out
      ejectZ = e * 6;                // slides toward the camera
      ejectY = e * 1.5;
      ejectSpin = e * Math.PI * 2;   // one full turn while it leaves
    }

    c.position.set(d.base.x, Math.sin(t * 1.2 + d.phase) * 0.15 + d.lift + ejectY, d.pull + ejectZ);
    c.rotation.y = Math.sin(t * 0.7 + d.phase) * 0.25 + ejectSpin + (isHover ? parallax.x * 0.5 : 0);
    c.rotation.x = (isHover ? -parallax.y * 0.3 : 0);
    d.reels.forEach((r) => { r.rotation.y += (isHover ? 0.14 : 0.04) + scrollVel * 0.2; });
  });

  // Hover detection
  if (finePointer && !reduceMotion && hoverTarget) {
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(bodies(), false)[0];
    hovered = hit ? hit.object.parent : null;
    document.body.style.cursor = hovered ? 'pointer' : '';
    if (hovered) {
      labelEl.textContent = '▶ ' + hovered.userData.name.toUpperCase();
      labelEl.classList.add('on');
    } else {
      labelEl.classList.remove('on');
    }
  }

  renderer.render(scene, camera);
}
frame();
