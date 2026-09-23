export const ELEMENTS = {
  H: { name: '水素', color: 0xf8fafc, radius: 0.31 },
  C: { name: '炭素', color: 0x334155, radius: 0.76 },
  O: { name: '酸素', color: 0xef4444, radius: 0.66 },
  N: { name: '窒素', color: 0x3b82f6, radius: 0.71 },
};

const atom = (element, x, y, z, label = element) => ({ element, position: [x, y, z], label });
const bond = (a, b, order = 1) => ({ a, b, order });

function water() {
  const length = 0.9572;
  const half = (104.5 / 2) * Math.PI / 180;
  const x = Math.sin(half) * length;
  const y = Math.cos(half) * length;
  return {
    id: 'water',
    name: '水分子 H₂O',
    formula: 'H₂O',
    summary: '酸素原子を中心に、2本のO–H結合が約104.5°で開く折れ線形の分子です。',
    atoms: [atom('O', 0, 0, 0), atom('H', x, y, 0), atom('H', -x, y, 0)],
    bonds: [bond(0, 1), bond(0, 2)],
    lonePairs: [
      { atom: 0, position: [0.42, -0.5, 0.58] },
      { atom: 0, position: [-0.42, -0.5, -0.58] },
    ],
    angles: [{ a: 1, center: 0, b: 2, label: '104.5°' }],
    cameraDistance: 4.7,
  };
}

function waterTetrahedron() {
  const base = water();
  return {
    ...base,
    id: 'water-tetrahedron',
    name: '水分子の電子対四面体',
    summary: '2本のO–H結合と2組の非共有電子対が、酸素の周囲でほぼ四面体方向に配置される模型です。',
    helpers: {
      tetrahedron: true,
      note: '電子対反発により、理想正四面体角109.5°から結合角が約104.5°へ狭まります。',
    },
    defaultLonePairs: true,
  };
}

function methane() {
  const s = 1.09 / Math.sqrt(3);
  return {
    id: 'methane',
    name: 'メタン CH₄',
    formula: 'CH₄',
    summary: '炭素を中心に4個の水素が正四面体方向へ並ぶ、代表的な四面体形分子です。',
    atoms: [
      atom('C', 0, 0, 0),
      atom('H', s, s, s), atom('H', -s, -s, s),
      atom('H', -s, s, -s), atom('H', s, -s, -s),
    ],
    bonds: [bond(0, 1), bond(0, 2), bond(0, 3), bond(0, 4)],
    angles: [{ a: 1, center: 0, b: 3, label: '109.5°' }],
    cameraDistance: 5.0,
  };
}

function carbonDioxide() {
  return {
    id: 'carbon-dioxide',
    name: '二酸化炭素 CO₂',
    formula: 'CO₂',
    summary: '炭素と2個の酸素が一直線に並び、O=C=Oの結合角は180°です。',
    atoms: [atom('C', 0, 0, 0), atom('O', -1.16, 0, 0), atom('O', 1.16, 0, 0)],
    bonds: [bond(0, 1, 2), bond(0, 2, 2)],
    angles: [{ a: 1, center: 0, b: 2, label: '180°' }],
    cameraDistance: 5.0,
  };
}

function benzene() {
  const atoms = [];
  const bonds = [];
  const carbonRadius = 1.4;
  const hydrogenRadius = 2.48;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 - i * Math.PI / 3;
    atoms.push(atom('C', Math.cos(a) * carbonRadius, Math.sin(a) * carbonRadius, 0));
  }
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 - i * Math.PI / 3;
    atoms.push(atom('H', Math.cos(a) * hydrogenRadius, Math.sin(a) * hydrogenRadius, 0));
    bonds.push(bond(i, (i + 1) % 6, i % 2 === 0 ? 2 : 1));
    bonds.push(bond(i, i + 6));
  }
  return {
    id: 'benzene',
    name: 'ベンゼン C₆H₆',
    formula: 'C₆H₆',
    summary: '6個の炭素が正六角形の環をつくる平面分子です。π電子は環全体に広がっています。',
    atoms,
    bonds,
    cameraDistance: 7.5,
  };
}

function cyclicHexamer() {
  const atoms = [];
  const bonds = [];
  const hydrogenBonds = [];
  const oxygenIndices = [];
  const donorHydrogenIndices = [];
  const radius = 2.25;
  const oh = 0.96;

  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const z = i % 2 === 0 ? 0.28 : -0.28;
    const ox = Math.cos(a) * radius;
    const oy = Math.sin(a) * radius;
    const oxygenIndex = atoms.length;
    oxygenIndices.push(oxygenIndex);
    atoms.push(atom('O', ox, oy, z));

    const nextA = ((i + 1) % 6) * Math.PI / 3;
    const nextZ = (i + 1) % 2 === 0 ? 0.28 : -0.28;
    const tx = Math.cos(nextA) * radius - ox;
    const ty = Math.sin(nextA) * radius - oy;
    const tz = nextZ - z;
    const tl = Math.hypot(tx, ty, tz);
    const h1 = atoms.length;
    donorHydrogenIndices.push(h1);
    atoms.push(atom('H', ox + tx / tl * oh, oy + ty / tl * oh, z + tz / tl * oh));

    const outward = a - Math.PI / 5;
    const h2 = atoms.length;
    atoms.push(atom('H', ox + Math.cos(outward) * oh, oy + Math.sin(outward) * oh, z + (i % 2 ? 0.2 : -0.2)));
    bonds.push(bond(oxygenIndex, h1), bond(oxygenIndex, h2));
  }
  for (let i = 0; i < 6; i++) {
    hydrogenBonds.push({ a: donorHydrogenIndices[i], b: oxygenIndices[(i + 1) % 6] });
  }
  return {
    id: 'water-hexamer',
    name: '水の六員環（環状水六量体）',
    formula: '(H₂O)₆',
    summary: '6個の水分子が水素結合で輪をつくる模式モデルです。酸素環はわずかに上下へ歪みます。',
    atoms,
    bonds,
    hydrogenBonds,
    defaultHydrogenBonds: true,
    cameraDistance: 9.0,
  };
}

function iceNetwork() {
  const atoms = [];
  const bonds = [];
  const hydrogenBonds = [];
  const ringO = [];
  const radius = 2.15;
  const levels = [-1.15, 1.15];
  for (let layer = 0; layer < 2; layer++) {
    ringO[layer] = [];
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + layer * Math.PI / 6;
      const ox = Math.cos(a) * radius;
      const oy = Math.sin(a) * radius;
      const oz = levels[layer];
      const oi = atoms.length;
      ringO[layer].push(oi);
      atoms.push(atom('O', ox, oy, oz));
      const hi1 = atoms.length;
      atoms.push(atom('H', ox * 0.8, oy * 0.8, oz));
      const hi2 = atoms.length;
      atoms.push(atom('H', ox, oy, oz + (layer === 0 ? 0.82 : -0.82)));
      bonds.push(bond(oi, hi1), bond(oi, hi2));
    }
  }
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < 6; i++) {
      hydrogenBonds.push({ a: ringO[layer][i] + 1, b: ringO[layer][(i + 1) % 6] });
      hydrogenBonds.push({ a: ringO[layer][i] + 2, b: ringO[1 - layer][i] });
    }
  }
  return {
    id: 'ice-network',
    name: '氷の六方晶ネットワーク',
    formula: 'ice Ih（模式図）',
    summary: '氷Ihの六員環と層間の水素結合を理解するための模式模型です。結晶学的な単位胞そのものではありません。',
    atoms,
    bonds,
    hydrogenBonds,
    defaultHydrogenBonds: true,
    cameraDistance: 10.5,
  };
}

export const MOLECULES = [
  water(),
  waterTetrahedron(),
  cyclicHexamer(),
  methane(),
  carbonDioxide(),
  benzene(),
  iceNetwork(),
];

export const MOLECULE_MAP = Object.fromEntries(MOLECULES.map(item => [item.id, item]));

export function interpretRequest(text) {
  const input = text.trim().toLowerCase();
  let molecule = null;
  if (/六員環|六量体|hexamer/.test(input)) molecule = 'water-hexamer';
  else if (/電子対|非共有|四面体/.test(input) && /水|h2o|h₂o/.test(input)) molecule = 'water-tetrahedron';
  else if (/氷|ice|結晶/.test(input)) molecule = 'ice-network';
  else if (/メタン|ch4|ch₄/.test(input)) molecule = 'methane';
  else if (/二酸化炭素|co2|co₂/.test(input)) molecule = 'carbon-dioxide';
  else if (/ベンゼン|benzene|c6h6|c₆h₆/.test(input)) molecule = 'benzene';
  else if (/水分子|h2o|h₂o|ウォーター/.test(input)) molecule = 'water';

  let style = null;
  if (/空間充填|space.?fill|cpk/.test(input)) style = 'spacefill';
  else if (/ワイヤー|wire/.test(input)) style = 'wire';
  else if (/ボール|スティック|ball/.test(input)) style = 'ballstick';

  return {
    molecule,
    style,
    labels: /原子名|ラベル|元素記号|名前/.test(input) ? true : null,
    angles: /角度|結合角|104\.5|109\.5|180/.test(input) ? true : null,
    hydrogenBonds: /水素結合|点線/.test(input) ? true : null,
    lonePairs: /電子対|非共有/.test(input) ? true : null,
    focusHydrogenBonds: /水素結合.*(だけ|強調)|強調.*水素結合/.test(input),
  };
}
