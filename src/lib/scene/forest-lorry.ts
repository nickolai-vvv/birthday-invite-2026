import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const LENGTH = 9.75; const categories = { board: { width: .4875, height: .08125 } };
import { createTruckCab } from '@/lib/scene/truck-cab';
import { createCargoWood, timberTone } from '@/lib/scene/wood-material';

export const MANIPULATOR_GROUND = -2.6;

// Все размеры согласованы с трёхметровыми досками и паллетом существующей сцены.
export function createManipulator(
  batched = true,
  options: { crane?: boolean; color?: number } = {},
) {
  const model = new THREE.Group();
  model.name = options.crane === false ? 'lorry' : 'manipulator';
  const paint = new THREE.MeshStandardMaterial({
    color: options.color ?? 0xc86f35,
    roughness: 0.64,
  });
  const frame = new THREE.MeshStandardMaterial({ color: 0x303834, roughness: 0.8 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x242927, roughness: 0.98 });
  const steel = new THREE.MeshStandardMaterial({
    color: 0x909a96,
    metalness: 0.48,
    roughness: 0.4,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x405e64,
    metalness: 0.15,
    roughness: 0.26,
    side: THREE.DoubleSide,
  });
  const timber = createCargoWood();
  const light = new THREE.MeshStandardMaterial({ color: 0xf1e7cc, roughness: 0.35 });
  const red = new THREE.MeshStandardMaterial({ color: 0xa2392b, roughness: 0.5 });
  const amber = new THREE.MeshStandardMaterial({ color: 0xe8aa45, roughness: 0.5 });
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, name = '') => {
    if (material === timber) {
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(
          new Float32Array(geometry.attributes.position.count * 3).fill(1),
          3,
        ),
      );
      const position = geometry.getAttribute('position');
      const timberPosition = new Float32Array(position.count * 3);
      for (let i = 0; i < position.count; i++) {
        timberPosition.set([position.getZ(i), position.getY(i), position.getX(i)], i * 3);
      }
      geometry.setAttribute('timberPosition', new THREE.Float32BufferAttribute(timberPosition, 3));
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    model.add(mesh);
    return mesh;
  };
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
  ) => {
    const mesh = add(new THREE.BoxGeometry(w, h, d), material, name);
    mesh.position.set(x, MANIPULATOR_GROUND + y, z);
    return mesh;
  };
  const cylinder = (
    name: string,
    x: number,
    y: number,
    z: number,
    radius: number,
    depth: number,
    material: THREE.Material,
    axis: 'y' | 'z' = 'y',
  ) => {
    const mesh = add(new THREE.CylinderGeometry(radius, radius, depth, 12), material, name);
    mesh.position.set(x, MANIPULATOR_GROUND + y, z);
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    return mesh;
  };
  const link = (
    name: string,
    a: THREE.Vector3Tuple,
    b: THREE.Vector3Tuple,
    width: number,
    depth: number,
    material: THREE.Material,
  ) => {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b);
    const mesh = box(name, 0, 0, 0, width, start.distanceTo(end), depth, material);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.position.y += MANIPULATOR_GROUND;
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    return mesh;
  };

  // Лонжероны, поперечины и оси связывают колёса с рамой.
  for (const z of [-1.12, 1.12]) box('chassis-rail', 0.9, 1.4, z, 15.8, 0.35, 0.18, frame);
  for (const x of [-5.8, -3.2, -0.5, 2.3, 5.1, 7.7])
    box('crossmember', x, 1.43, 0, 0.18, 0.27, 3.6, frame);
  const tyreProfile = [
    [0.5, -0.23],
    [0.7, -0.23],
    [0.82, -0.18],
    [0.88, -0.1],
    [0.88, 0.1],
    [0.82, 0.18],
    [0.7, 0.23],
    [0.5, 0.23],
    [0.5, -0.23],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const tyreGeometry = new THREE.LatheGeometry(tyreProfile, 16);
  for (const [axle, x] of [-4.4, -2, 7.7].entries()) {
    cylinder('axle', x, 0.88, 0, 0.14, 3.85, frame, 'z');
    for (const side of [-1, 1]) {
      const offsets = axle === 2 ? [1.85] : [1.47, 1.96];
      for (const offset of offsets) {
        const tyre = add(tyreGeometry, rubber, 'tyre');
        tyre.rotation.x = Math.PI / 2;
        tyre.position.set(x, MANIPULATOR_GROUND + 0.88, side * offset);
      }
      const outside = side * (axle === 2 ? 2.1 : 2.21);
      cylinder('wheel-rim', x, 0.88, outside, 0.53, 0.09, steel, 'z');
      cylinder('wheel-hub', x, 0.88, outside + side * 0.08, 0.23, 0.2, frame, 'z');
      box('suspension', x, 1.23, side * 1.1, 1.5, 0.11, 0.32, frame);
    }
  }
  for (const side of [-1, 1]) {
    box('mudflap', -5.55, 0.86, side * 1.96, 0.1, 1.1, 0.6, rubber);
    box('fuel-tank', 1.2, 1.05, side * 1.42, 2.2, 0.8, 0.85, steel);
    for (const x of [0.55, 1.85]) box('tank-strap', x, 1.05, side * 1.43, 0.1, 0.84, 0.89, frame);
    box('step', 6.25, 0.85, side * 1.85, 0.65, 0.13, 0.62, steel);
    box('step', 6.25, 1.16, side * 1.78, 0.65, 0.12, 0.48, steel);
  }

  // Полезная платформа 11 × 3.8; паллет и длинные доски полностью помещаются между бортами.
  box('deck', -1, 1.98, 0, 11.1, 0.22, 4, steel);
  box('deck-frame', -1, 1.77, 0, 11.35, 0.25, 4.12, steel);
  for (const side of [-1, 1]) {
    box('sideboard', -1, 2.39, side * 1.99, 11.1, 0.56, 0.1, paint);
    for (const x of [-6.45, -3.75, -1, 1.75, 4.45])
      box('sideboard-post', x, 2.39, side * 2.06, 0.11, 0.65, 0.08, steel);
    box('sideboard-rail', -1, 2.71, side * 2, 11.3, 0.08, 0.13, steel);
  }
  for (const x of [-6.5, 4.5]) box('tailgate', x, 2.4, 0, 0.1, 0.58, 3.92, paint);
  box('rear-underrun', -6.7, 0.95, 0, 0.15, 0.25, 3.65, steel);
  for (const side of [-1, 1]) {
    box('tail-light', -6.69, 1.47, side * 1.55, 0.09, 0.2, 0.43, red);
    box('rear-indicator', -6.75, 1.47, side * 1.27, 0.09, 0.2, 0.15, amber);
  }
  for (const x of [-4.45, -1, 2.45]) {
    for (const z of [-1.35, 0, 1.35]) box('load-pallet', x, 2.19, z, 0.5, 0.2, 0.3, timber);
    box('load-pallet', x, 2.33, 0, 0.55, 0.08, 3.5, timber);
  }
  const board = categories.board;
  const loadRows = 12;
  for (let row = 0; row < loadRows; row++)
    for (let col = 0; col < 6; col++) {
      const plank = box(
        'load-board',
        -1,
        2.37 + board.height / 2 + row * (board.height + 0.022),
        (col - 2.5) * (board.width + 0.035),
        LENGTH,
        board.height,
        board.width,
        timber,
      );
      // Небольшой разброс тона сохраняется при объединении досок в один меш.
      const tone = timberTone(row * 6 + col);
      const colors = plank.geometry.getAttribute('color');
      for (let i = 0; i < colors.count; i++) colors.setXYZ(i, tone, tone, tone);
    }
  // Тонкие стяжки огибают пакет целиком и удерживают его на паллете.
  const loadTop = 2.37 + loadRows * board.height + (loadRows - 1) * 0.022;
  for (const x of [-3.8, 1.8]) {
    box('load-strap-top', x, loadTop + 0.018, 0, 0.09, 0.035, 3.2, frame);
    for (const side of [-1, 1])
      box(
        'load-strap-side',
        x,
        (loadTop + 2.37) / 2,
        side * 1.6,
        0.09,
        loadTop - 2.37,
        0.035,
        frame,
      );
  }

  const cab = createTruckCab({ paint, frame, steel, glass, light, amber }, MANIPULATOR_GROUND);
  model.add(...[...cab.children]);

  // Кран сложен за кабиной: непрерывная цепочка от рамы до крюка, без висящих деталей.
  if (options.crane !== false) {
    box('crane-base', 5.17, 2.03, 0, 1.08, 0.38, 3.7, frame);
    cylinder('crane-turntable', 5.17, 2.45, 0, 0.59, 0.55, steel);
    box('crane-pedestal', 5.17, 2.94, 0, 0.7, 0.68, 0.76, paint);
    const a: THREE.Vector3Tuple = [5.17, 3.16, 0];
    const b: THREE.Vector3Tuple = [4.12, 6.25, 0];
    const c: THREE.Vector3Tuple = [5.49, 4.28, 0];
    const d: THREE.Vector3Tuple = [5.03, 3.4, 0];
    link('crane-main-boom', a, b, 0.5, 0.58, paint);
    link('crane-folding-boom', b, c, 0.39, 0.47, paint);
    link('crane-telescope', c, d, 0.26, 0.32, steel);
    for (const [index, point] of [a, b, c, d].entries()) {
      cylinder(`crane-joint-${index}`, ...point, index === 3 ? 0.14 : 0.24, 0.74, frame, 'z');
      for (const side of [-1, 1])
        cylinder('crane-pin', point[0], point[1], side * 0.39, 0.105, 0.08, steel, 'z');
    }
    link('hydraulic-barrel', [5.48, 2.96, 0.4], [4.98, 4.35, 0.4], 0.19, 0.19, frame);
    link('hydraulic-piston', [4.98, 4.35, 0.4], [4.51, 5.66, 0.4], 0.11, 0.11, steel);
    link('fold-cylinder', [4.25, 5.79, -0.39], [4.84, 5.08, -0.39], 0.14, 0.14, frame);
    link('fold-piston', [4.84, 5.08, -0.39], [5.35, 4.47, -0.39], 0.085, 0.085, steel);
    const hose = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5.25, 2.9, -0.45),
      new THREE.Vector3(4.55, 4.55, -0.45),
      new THREE.Vector3(4.05, 6.3, -0.45),
      new THREE.Vector3(4.75, 5.53, -0.45),
    ]);
    add(new THREE.TubeGeometry(hose, 12, 0.05, 5, false), rubber, 'hydraulic-hose').position.y =
      MANIPULATOR_GROUND;
    link('hook-link', d, [5.03, 3.1, 0], 0.075, 0.075, frame);
    const hook = add(new THREE.TorusGeometry(0.14, 0.055, 5, 10, Math.PI * 1.65), frame, 'hook');
    hook.position.set(5.03, MANIPULATOR_GROUND + 2.99, 0);
    for (const side of [-1, 1]) {
      box('stowed-outrigger', 5.17, 2.14, side * 1.88, 0.29, 1.4, 0.32, paint);
      box('outrigger-foot', 5.17, 1.42, side * 1.88, 0.58, 0.12, 0.59, frame);
    }
  }

  if (batched) {
    // Девять материалов означают девять вызовов отрисовки для всей машины с грузом.
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const sourceGeometry = new Set<THREE.BufferGeometry>();
    for (const child of [...model.children]) {
      const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
      mesh.updateMatrix();
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrix);
      geometry.deleteAttribute('uv');
      if (!batches.has(mesh.material)) batches.set(mesh.material, []);
      batches.get(mesh.material)!.push(geometry);
      sourceGeometry.add(mesh.geometry);
      model.remove(mesh);
    }
    for (const [material, geometries] of batches) {
      const geometry = mergeGeometries(geometries);
      if (!geometry) throw new Error('Не удалось объединить детали манипулятора');
      geometry.computeBoundingSphere();
      model.add(new THREE.Mesh(geometry, material));
      geometries.forEach((piece) => piece.dispose());
    }
    sourceGeometry.forEach((geometry) => geometry.dispose());
  }
  return model;
}

