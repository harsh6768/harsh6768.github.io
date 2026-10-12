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
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
const aim = new THREE.Vector3(1.5, 0, 0);

const INK = 0xe9f1ff, ACCENT = 0xffd166;
const lineMat = (color, opacity = 1) => new THREE.LineBasicMaterial({ color, transparent: true, opacity });

// Faint floor grid, like the ground plane of an elevation drawing
const floorPts = [];
for (let x = -30; x <= 30; x += 2) floorPts.push(new THREE.Vector3(x, -3.4, -20), new THREE.Vector3(x, -3.4, 20));
for (let z = -20; z <= 20; z += 2) floorPts.push(new THREE.Vector3(-30, -3.4, z), new THREE.Vector3(30, -3.4, z));
scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(floorPts), lineMat(INK, 0.12)));

/* ---------- The rack: edges drawn bottom to top under a scan line ---------- */
const RACK_X = 4.6;
const rack = new THREE.Group();
rack.position.set(RACK_X, 0, 0);
scene.add(rack);

const edgeSets = [];
function addEdges(geometry, x, y, z) {
  const arr = new THREE.EdgesGeometry(geometry).attributes.position.array.slice();
  for (let i = 0; i < arr.length; i += 3) { arr[i] += x; arr[i + 1] += y; arr[i + 2] += z; }
  edgeSets.push({ arr, y });
}
addEdges(new THREE.BoxGeometry(3.2, 6.4, 2.4), 0, 0, 0); // chassis
for (let k = 0; k < 9; k++) addEdges(new THREE.BoxGeometry(2.8, 0.3, 2.0), 0, -2.8 + k * 0.7, 0); // shelves
addEdges(new THREE.BoxGeometry(3.6, 0.2, 2.8), 0, -3.3, 0); // feet
edgeSets.sort((a, b) => a.y - b.y);

const totalFloats = edgeSets.reduce((n, s) => n + s.arr.length, 0);
const rackPositions = new Float32Array(totalFloats);
let off = 0;
edgeSets.forEach((s) => { rackPositions.set(s.arr, off); off += s.arr.length; });
const rackGeo = new THREE.BufferGeometry();
rackGeo.setAttribute('position', new THREE.BufferAttribute(rackPositions, 3));
rackGeo.setDrawRange(0, reduceMotion ? totalFloats / 3 : 0);
rack.add(new THREE.LineSegments(rackGeo, lineMat(INK, 0.95)));
const rackVertexCount = totalFloats / 3;
const RACK_BOTTOM = -3.4, RACK_TOP = 3.3;
const DRAW_SECONDS = 3.2;

// Scan line: a bright bar that sweeps up the rack while it draws
const scanGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.4, 0, 1.4), new THREE.Vector3(2.4, 0, 1.4)]);
const scanLine = new THREE.Line(scanGeo, lineMat(ACCENT, 0.9));
rack.add(scanLine);

// Dimension line on the right with ticks; fades in after the drawing finishes
const dimPts = [];
const DIM_X = 2.4;
dimPts.push(new THREE.Vector3(DIM_X, RACK_BOTTOM, 0), new THREE.Vector3(DIM_X, RACK_TOP, 0));
for (let y = RACK_BOTTOM; y <= RACK_TOP + 0.01; y += 0.67) {
  dimPts.push(new THREE.Vector3(DIM_X - 0.2, y, 0), new THREE.Vector3(DIM_X + 0.2, y, 0));
}
const dimMat = lineMat(ACCENT, 0);
rack.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(dimPts), dimMat));

/* ---------- Modules: slide out of the rack as you scroll, pop forward on hover ---------- */
const modules = [];
const leaderGroup = new THREE.Group();
scene.add(leaderGroup);
const leaderMat = lineMat(ACCENT, 0.9);
const CALLOUT = new THREE.Vector3(8.2, 0, 3.6);

projects.forEach((p, i) => {
  const y = -2.2 + i * 0.85;
  const geo = new THREE.BoxGeometry(2.3, 0.55, 1.5);
  const group = new THREE.Group();
  group.position.set(0, y, 1.7); // local to the rack, so modules turn with it
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(INK, 0.9)));
  const hit = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  group.add(hit);
  // A small packet that travels along the leader line while it is active
  const packet = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: ACCENT }));
  packet.visible = false;
  leaderGroup.add(packet);
  const leader = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), leaderMat);
  leader.visible = false;
  leaderGroup.add(leader);
  group.userData = {
    url: p.url, name: p.name, edges: group.children[0], hit, base: new THREE.Vector3(0, y, 1.7),
    leader, packet, pos: 0, vel: 0, hot: 0, index: i,
  };
  rack.add(group);
  modules.push(group);
});

/* ---------- Pointer ---------- */
const labelEl = document.getElementById('orb-label');
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2(9, 9);
const parallax = new THREE.Vector2(0, 0);
let hovered = null;
if (finePointer) {
  window.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    labelEl.style.left = e.clientX + 'px';
    labelEl.style.top = e.clientY + 'px';
  });
}
window.addEventListener('click', (e) => {
  if (e.target.closest('a, button, .block, .card')) return;
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(modules.map((m) => m.userData.hit), false)[0];
  if (hit) window.open(hit.object.parent.userData.url, '_blank', 'noopener');
});

/* ---------- Scroll: turntable + exploded view ---------- */
let scrollT = 0; // smoothed 0..1 across the page
function scrollProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;
}

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

// Critically damped spring step: smooth start and stop without overshoot
function spring(pos, vel, target, dt, k = 120) {
  const c = 2 * Math.sqrt(k);
  const acc = k * (target - pos) - c * vel;
  vel += acc * dt;
  pos += vel * dt;
  return [pos, vel];
}

function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // Camera drifts with the pointer
  parallax.x += (pointer.x * 0.5 - parallax.x) * 0.05;
  parallax.y += (pointer.y * 0.3 - parallax.y) * 0.05;
  camera.position.set(parallax.x, 1.5 + parallax.y, 15);
  camera.lookAt(aim);

  // 1) Draw-on with a scan line; once done, the dimension line fades in
  const p = reduceMotion ? 1 : Math.min(t / DRAW_SECONDS, 1);
  const eased = 1 - Math.pow(1 - p, 2);
  rackGeo.setDrawRange(0, Math.floor(eased * rackVertexCount));
  const scanY = RACK_BOTTOM + eased * (RACK_TOP - RACK_BOTTOM);
  scanLine.position.y = scanY;
  scanLine.visible = p < 1;
  dimMat.opacity += ((p >= 1 ? 0.7 : 0) - dimMat.opacity) * 0.06;

  // 2) Scroll: the rack turns and the modules explode outward from it
  scrollT += (scrollProgress() - scrollT) * 0.08;
  const explode = reduceMotion ? 0 : Math.sin(Math.min(scrollT * 1.4, 1) * Math.PI / 2);
  rack.rotation.y = reduceMotion ? 0 : scrollT * Math.PI * 1.2 + parallax.x * 0.15;
  rack.position.y = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.08;

  // 3) Modules: exploded offset from scroll, plus a spring pop on hover
  const callout = CALLOUT.clone();
  modules.forEach((m) => {
    const d = m.userData;
    const isHot = m === hovered;
    const spread = explode * (d.index - (modules.length - 1) / 2) * 0.35; // fan out vertically
    const targetPos = (isHot ? 1.2 : 0) + explode * 1.4;
    [d.pos, d.vel] = spring(d.pos, d.vel, targetPos, dt);
    d.hot += ((isHot ? 1 : 0) - d.hot) * 0.18;
    m.position.set(d.base.x, d.base.y + spread, d.base.z + d.pos);

    d.edges.material.color.setRGB(
      (0xe9 + (0xff - 0xe9) * d.hot) / 255,
      (0xf1 + (0xd1 - 0xf1) * d.hot) / 255,
      (0xff + (0x66 - 0xff) * d.hot) / 255
    );

    const active = d.hot > 0.05;
    d.leader.visible = active;
    d.packet.visible = active;
    if (active) {
      const start = new THREE.Vector3(d.base.x + 1.2, d.base.y + spread, d.base.z + d.pos).applyMatrix4(rack.matrixWorld);
      const end = callout.clone();
      end.y = start.y;
      const reach = Math.min(d.hot, 1);
      d.leader.geometry.setFromPoints([start, start.clone().lerp(end, reach)]);
      // Packet rides along the leader, looping
      const along = (t * 0.6 + d.index * 0.2) % 1;
      d.packet.position.copy(start).lerp(end, along * reach);
    }
  });

  if (finePointer && !reduceMotion) {
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(modules.map((m) => m.userData.hit), false)[0];
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
