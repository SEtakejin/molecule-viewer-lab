import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { ELEMENTS, MOLECULES, MOLECULE_MAP, interpretRequest } from './molecule-data.js';

const viewer = document.getElementById('viewer');
const loading = document.getElementById('loading');
const moleculeSelect = document.getElementById('moleculeSelect');
const moleculeName = document.getElementById('moleculeName');
const formula = document.getElementById('formula');
const summary = document.getElementById('summary');
const note = document.getElementById('note');
const labelsBtn = document.getElementById('labelsBtn');
const anglesBtn = document.getElementById('anglesBtn');
const hydrogenBtn = document.getElementById('hydrogenBtn');
const lonePairsBtn = document.getElementById('lonePairsBtn');
const autoBtn = document.getElementById('autoBtn');
const requestInput = document.getElementById('requestInput');
const requestMessage = document.getElementById('requestMessage');

const state = {
  molecule: 'water',
  style: 'ballstick',
  labels: false,
  angles: false,
  hydrogenBonds: false,
  lonePairs: false,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06111d);
scene.fog = new THREE.FogExp2(0x06111d, 0.018);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.01, 120);
camera.position.set(4.5, 3.6, 5.8);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
viewer.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'fixed';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.zIndex = '6';
viewer.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.9;
controls.minDistance = 2.4;
controls.maxDistance = 26;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  updateAutoButton();
});

scene.add(new THREE.HemisphereLight(0xd9f2ff, 0x102238, 2.5));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
keyLight.position.set(6, 8, 7);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x79bfff, 2.2);
fillLight.position.set(-6, 1, -5);
scene.add(fillLight);
const warmLight = new THREE.PointLight(0xffd6a5, 1.3, 22);
warmLight.position.set(0, -5, 3);
scene.add(warmLight);

const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 500; i++) {
  const r = 24 + Math.random() * 45;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPositions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x8cc8ef, size: 0.035, transparent: true, opacity: 0.5 })));

let moleculeRoot = new THREE.Group();
scene.add(moleculeRoot);
let atomMeshes = [];
let bondObjects = [];
let labelObjects = [];
let angleObjects = [];
let hydrogenBondObjects = [];
let lonePairObjects = [];
let helperObjects = [];

MOLECULES.forEach(item => {
  const option = document.createElement('option');
  option.value = item.id;
  option.textContent = `${item.name}　${item.formula}`;
  moleculeSelect.appendChild(option);
});

function materialForElement(element) {
  const data = ELEMENTS[element] || ELEMENTS.C;
  return new THREE.MeshPhysicalMaterial({
    color: data.color,
    roughness: 0.3,
    metalness: 0.02,
    clearcoat: 0.32,
    clearcoatRoughness: 0.25,
  });
}

function disposeObject(object) {
  object.traverse(child => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.());
    else child.material?.dispose?.();
    if (child.isCSS2DObject && child.element?.remove) child.element.remove();
  });
}

function clearMolecule() {
  scene.remove(moleculeRoot);
  disposeObject(moleculeRoot);
  moleculeRoot = new THREE.Group();
  scene.add(moleculeRoot);
  atomMeshes = [];
  bondObjects = [];
  labelObjects = [];
  angleObjects = [];
  hydrogenBondObjects = [];
  lonePairObjects = [];
  helperObjects = [];
}

function cylinderBetween(a, b, radius, material) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 20, 1, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function addBond(a, b, order = 1) {
  const pa = new THREE.Vector3(...a);
  const pb = new THREE.Vector3(...b);
  const group = new THREE.Group();
  const color = state.style === 'wire' ? 0xb9d7ec : 0xb7c6d1;
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.12 });
  const radius = state.style === 'wire' ? 0.035 : 0.10;

  if (order === 1 || state.style === 'wire') {
    group.add(cylinderBetween(pa, pb, radius, material));
  } else {
    const axis = new THREE.Vector3().subVectors(pb, pa).normalize();
    const reference = Math.abs(axis.z) < 0.85 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const offset = new THREE.Vector3().crossVectors(axis, reference).normalize().multiplyScalar(0.11);
    group.add(cylinderBetween(pa.clone().add(offset), pb.clone().add(offset), radius * 0.72, material));
    group.add(cylinderBetween(pa.clone().sub(offset), pb.clone().sub(offset), radius * 0.72, material));
  }
  moleculeRoot.add(group);
  bondObjects.push(group);
}

function addAtom(item, index) {
  const element = ELEMENTS[item.element] || ELEMENTS.C;
  const factor = state.style === 'spacefill' ? 1.18 : state.style === 'wire' ? 0.22 : 0.48;
  const radius = Math.max(0.08, element.radius * factor);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 22), materialForElement(item.element));
  sphere.position.set(...item.position);
  sphere.userData = { atomIndex: index, element: item.element };
  moleculeRoot.add(sphere);
  atomMeshes.push(sphere);

  const el = document.createElement('div');
  el.className = 'atom-label';
  el.textContent = item.label || item.element;
  const label = new CSS2DObject(el);
  label.position.set(0, radius + 0.24, 0);
  label.visible = state.labels;
  sphere.add(label);
  labelObjects.push(label);
}

function addHydrogenBond(a, b) {
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  const line = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: 0x67e8f9, dashSize: 0.13, gapSize: 0.09, transparent: true, opacity: 0.9 }));
  line.computeLineDistances();
  line.visible = state.hydrogenBonds;
  moleculeRoot.add(line);
  hydrogenBondObjects.push(line);
}

function addLonePair(pair) {
  const group = new THREE.Group();
  const center = new THREE.Vector3(...pair.position);
  const oxygen = atomMeshes[pair.atom]?.position || new THREE.Vector3();
  const axis = center.clone().sub(oxygen).normalize();
  const reference = Math.abs(axis.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const separation = new THREE.Vector3().crossVectors(axis, reference).normalize().multiplyScalar(0.09);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x311b92, emissiveIntensity: 0.75, roughness: 0.24 });
  for (const sign of [-1, 1]) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), mat);
    dot.position.copy(center).addScaledVector(separation, sign);
    group.add(dot);
  }
  group.visible = state.lonePairs;
  moleculeRoot.add(group);
  lonePairObjects.push(group);
}

function addAngle(angle, molecule) {
  const center = new THREE.Vector3(...molecule.atoms[angle.center].position);
  const va = new THREE.Vector3(...molecule.atoms[angle.a].position).sub(center).normalize();
  const vb = new THREE.Vector3(...molecule.atoms[angle.b].position).sub(center).normalize();
  const points = [];
  const arcRadius = 0.58;
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const v = va.clone().multiplyScalar(1 - t).addScaledVector(vb, t).normalize().multiplyScalar(arcRadius).add(center);
    points.push(v);
  }
  const group = new THREE.Group();
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x7dd3fc }));
  group.add(line);
  const el = document.createElement('div');
  el.className = 'angle-label';
  el.textContent = angle.label;
  const label = new CSS2DObject(el);
  label.position.copy(points[Math.floor(points.length / 2)]).multiplyScalar(1.13);
  group.add(label);
  group.visible = state.angles;
  moleculeRoot.add(group);
  angleObjects.push(group);
}

function addTetrahedronHelper(molecule) {
  if (!molecule.helpers?.tetrahedron || molecule.lonePairs?.length !== 2) return;
  const points = [
    new THREE.Vector3(...molecule.atoms[1].position),
    new THREE.Vector3(...molecule.atoms[2].position),
    new THREE.Vector3(...molecule.lonePairs[0].position),
    new THREE.Vector3(...molecule.lonePairs[1].position),
  ];
  const material = new THREE.LineDashedMaterial({ color: 0x93c5fd, dashSize: 0.06, gapSize: 0.045, transparent: true, opacity: 0.5 });
  const group = new THREE.Group();
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([points[i], points[j]]), material);
      line.computeLineDistances();
      group.add(line);
    }
  }
  moleculeRoot.add(group);
  helperObjects.push(group);
}

function buildMolecule(resetCamera = true) {
  const molecule = MOLECULE_MAP[state.molecule] || MOLECULE_MAP.water;
  clearMolecule();

  if (state.style !== 'spacefill') {
    molecule.bonds.forEach(item => addBond(molecule.atoms[item.a].position, molecule.atoms[item.b].position, item.order));
  }
  molecule.atoms.forEach(addAtom);
  molecule.hydrogenBonds?.forEach(item => addHydrogenBond(molecule.atoms[item.a].position, molecule.atoms[item.b].position));
  molecule.lonePairs?.forEach(addLonePair);
  molecule.angles?.forEach(item => addAngle(item, molecule));
  addTetrahedronHelper(molecule);

  moleculeName.textContent = molecule.name;
  formula.textContent = molecule.formula;
  summary.textContent = molecule.summary;
  note.textContent = molecule.helpers?.note || '';
  note.hidden = !molecule.helpers?.note;
  moleculeSelect.value = molecule.id;

  if (resetCamera) resetView(false);
  syncButtons();
  updateUrl();
}

function resetView(enableAuto = true) {
  const molecule = MOLECULE_MAP[state.molecule];
  const distance = molecule.cameraDistance || 6;
  camera.position.set(distance * 0.72, distance * 0.55, distance);
  controls.target.set(0, 0, 0);
  controls.autoRotate = enableAuto;
  controls.update();
  updateAutoButton();
}

function updateAutoButton() {
  autoBtn.textContent = controls.autoRotate ? '自動回転 ON' : '自動回転 OFF';
  autoBtn.classList.toggle('active', controls.autoRotate);
}

function syncButtons() {
  document.querySelectorAll('[data-style]').forEach(btn => btn.classList.toggle('active', btn.dataset.style === state.style));
  labelsBtn.classList.toggle('active', state.labels);
  anglesBtn.classList.toggle('active', state.angles);
  hydrogenBtn.classList.toggle('active', state.hydrogenBonds);
  lonePairsBtn.classList.toggle('active', state.lonePairs);
  const molecule = MOLECULE_MAP[state.molecule];
  hydrogenBtn.disabled = !molecule.hydrogenBonds?.length;
  lonePairsBtn.disabled = !molecule.lonePairs?.length;
  anglesBtn.disabled = !molecule.angles?.length;
}

function setMolecule(id) {
  const molecule = MOLECULE_MAP[id];
  if (!molecule) return;
  state.molecule = id;
  state.hydrogenBonds = Boolean(molecule.defaultHydrogenBonds);
  state.lonePairs = Boolean(molecule.defaultLonePairs);
  state.angles = false;
  state.labels = false;
  buildMolecule(true);
}

function toggleVisibility(key, objects) {
  state[key] = !state[key];
  objects.forEach(object => { object.visible = state[key]; });
  syncButtons();
  updateUrl();
}

function updateUrl() {
  const params = new URLSearchParams();
  params.set('molecule', state.molecule);
  params.set('style', state.style);
  if (state.labels) params.set('labels', '1');
  if (state.angles) params.set('angles', '1');
  if (state.hydrogenBonds) params.set('hbonds', '1');
  if (state.lonePairs) params.set('pairs', '1');
  history.replaceState(null, '', `${location.pathname}?${params}`);
}

function applyRequest(text) {
  const result = interpretRequest(text);
  if (!result.molecule && !result.style && result.labels === null && result.angles === null && result.hydrogenBonds === null && result.lonePairs === null) {
    requestMessage.textContent = 'その指定はまだ登録されていません。水分子、水の六員環、メタン、二酸化炭素、ベンゼン、氷から選べます。';
    return;
  }

  if (result.molecule) state.molecule = result.molecule;
  const molecule = MOLECULE_MAP[state.molecule];
  if (result.style) state.style = result.style;
  if (result.labels !== null) state.labels = result.labels;
  if (result.angles !== null) state.angles = result.angles && Boolean(molecule.angles?.length);
  if (result.hydrogenBonds !== null) state.hydrogenBonds = result.hydrogenBonds && Boolean(molecule.hydrogenBonds?.length);
  else if (result.molecule) state.hydrogenBonds = Boolean(molecule.defaultHydrogenBonds);
  if (result.lonePairs !== null) state.lonePairs = result.lonePairs && Boolean(molecule.lonePairs?.length);
  else if (result.molecule) state.lonePairs = Boolean(molecule.defaultLonePairs);

  buildMolecule(true);
  requestMessage.textContent = `${molecule.name}を${state.style === 'spacefill' ? '空間充填' : state.style === 'wire' ? 'ワイヤー' : 'ボール＆スティック'}モデルで表示しました。`;
}

moleculeSelect.addEventListener('change', event => setMolecule(event.target.value));

document.querySelectorAll('[data-style]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.style = btn.dataset.style;
    buildMolecule(false);
  });
});

labelsBtn.addEventListener('click', () => toggleVisibility('labels', labelObjects));
anglesBtn.addEventListener('click', () => toggleVisibility('angles', angleObjects));
hydrogenBtn.addEventListener('click', () => toggleVisibility('hydrogenBonds', hydrogenBondObjects));
lonePairsBtn.addEventListener('click', () => toggleVisibility('lonePairs', lonePairObjects));

autoBtn.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  updateAutoButton();
});
document.getElementById('resetBtn').addEventListener('click', () => resetView(true));
document.getElementById('fullBtn').addEventListener('click', async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  else await document.exitFullscreen();
});
document.getElementById('saveBtn').addEventListener('click', () => {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.download = `${state.molecule}-${state.style}.png`;
  link.href = renderer.domElement.toDataURL('image/png');
  link.click();
});

document.getElementById('requestForm').addEventListener('submit', event => {
  event.preventDefault();
  applyRequest(requestInput.value);
});
document.querySelectorAll('[data-example]').forEach(btn => {
  btn.addEventListener('click', () => {
    requestInput.value = btn.dataset.example;
    applyRequest(btn.dataset.example);
  });
});

function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  const id = params.get('molecule');
  if (id && MOLECULE_MAP[id]) state.molecule = id;
  const style = params.get('style');
  if (['ballstick', 'spacefill', 'wire'].includes(style)) state.style = style;
  state.labels = params.get('labels') === '1';
  state.angles = params.get('angles') === '1';
  state.hydrogenBonds = params.get('hbonds') === '1' || Boolean(MOLECULE_MAP[state.molecule].defaultHydrogenBonds);
  state.lonePairs = params.get('pairs') === '1' || Boolean(MOLECULE_MAP[state.molecule].defaultLonePairs);
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

try {
  loadFromUrl();
  buildMolecule(true);
  animate();
  loading.style.display = 'none';
} catch (error) {
  console.error(error);
  loading.textContent = '分子モデルを表示できませんでした。ページを再読み込みしてください。';
}
