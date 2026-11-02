import * as THREE from 'three';

type CabMaterials = Record<
  'paint' | 'frame' | 'steel' | 'glass' | 'light' | 'amber',
  THREE.Material
>;

// Общая кабина: одинаковые стёкла, зеркала и панели у грузовиков на площадке и тягача.
export function createTruckCab(
  materials: CabMaterials,
  ground = 0,
  options: { wheelArch?: { centerY: number; radius: number } } = {},
) {
  const { paint, frame, steel, glass, light, amber } = materials;
  const model = new THREE.Group();
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
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
    mesh.position.set(x, ground + y, z);
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
    mesh.position.y += ground;
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    return mesh;
  };

  // Кабина с наклонным лобовым стеклом и вырезами над передними колёсами.
  const outline = new THREE.Shape();
  outline.moveTo(5.95, 1.35);
  outline.lineTo(5.95, 4.22);
  outline.quadraticCurveTo(6.05, 4.6, 6.4, 4.6);
  outline.lineTo(8.25, 4.6);
  outline.lineTo(8.8, 3.1);
  outline.lineTo(8.9, 1.35);
  if (options.wheelArch) {
    const { centerY, radius } = options.wheelArch;
    const startAngle = Math.asin((1.35 - centerY) / radius);
    outline.lineTo(7.7 + radius * Math.cos(startAngle), 1.35);
    outline.absarc(7.7, centerY, radius, startAngle, Math.PI - startAngle, false);
  } else {
    outline.lineTo(8.55, 1.35);
    outline.quadraticCurveTo(8.4, 1.98, 7.7, 1.98);
    outline.quadraticCurveTo(7, 1.98, 6.85, 1.35);
  }
  outline.closePath();
  const cab = add(
    new THREE.ExtrudeGeometry(outline, {
      depth: 3.5,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 1,
      steps: 1,
      curveSegments: 5,
    }),
    paint,
    'cab',
  );
  cab.position.set(0, ground, -1.75);
  if (options.wheelArch) {
    // Узкая окантовка повторяет окружность шины, сохраняя равномерный зазор.
    const { centerY, radius } = options.wheelArch;
    const outer = radius + 0.075;
    const a = Math.asin((1.35 - centerY) / radius);
    const b = Math.asin((1.35 - centerY) / outer);
    const trim = new THREE.Shape();
    trim.absarc(7.7, centerY, outer, b, Math.PI - b, false);
    trim.lineTo(7.7 - radius * Math.cos(a), 1.35);
    trim.absarc(7.7, centerY, radius, Math.PI - a, a, true);
    trim.closePath();
    for (const side of [-1, 1]) {
      const surround = add(new THREE.ShapeGeometry(trim, 16), frame, 'wheel-arch-trim');
      surround.position.set(0, ground, side * 1.8);
      if (side < 0) {
        surround.rotation.y = Math.PI;
        surround.position.x = 15.4;
      }
    }
  }
  const window = new THREE.Shape();
  window.moveTo(6.23, 3.12);
  window.lineTo(6.23, 4.28);
  window.lineTo(8.1, 4.28);
  window.lineTo(8.5, 3.12);
  window.closePath();
  for (const side of [-1, 1]) {
    const pane = add(new THREE.ShapeGeometry(window), glass, 'side-window');
    pane.position.set(0, ground, side * 1.8);
    box('window-pillar', 7.02, 3.7, side * 1.82, 0.085, 1.23, 0.055, paint);
    box('door-handle', 6.48, 2.87, side * 1.82, 0.32, 0.075, 0.065, frame);
    box('door-seam', 6.14, 2.35, side * 1.81, 0.025, 1.25, 0.02, frame);
    link('mirror-arm', [8.35, 3.5, side * 1.72], [8.35, 3.5, side * 2.18], 0.075, 0.075, frame);
    box('mirror', 8.35, 3.45, side * 2.18, 0.15, 0.57, 0.3, frame);
    box('mirror-glass', 8.265, 3.45, side * 2.18, 0.015, 0.45, 0.23, glass);
    box('headlight', 8.98, 1.76, side * 1.24, 0.08, 0.36, 0.68, light);
    box('front-indicator', 8.99, 1.76, side * 1.64, 0.08, 0.36, 0.13, amber);
  }
  const windshield = new THREE.BufferGeometry();
  windshield.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        8.83, 3.23, -1.5, 8.43, 4.33, -1.5, 8.43, 4.33, 1.5, 8.83, 3.23, -1.5, 8.43, 4.33, 1.5,
        8.83, 3.23, 1.5,
      ],
      3,
    ),
  );
  windshield.computeVertexNormals();
  windshield.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(12), 2));
  add(windshield, glass, 'windshield').position.y = ground;
  box('front-grille', 8.95, 2.45, 0, 0.1, 0.78, 2.5, frame);
  for (const y of [2.22, 2.45, 2.68]) box('grille-bar', 9.01, y, 0, 0.035, 0.055, 2.25, steel);
  box('bumper', 8.99, 1.19, 0, 0.28, 0.32, 3.79, frame);
  box('number-plate', 9.145, 1.26, 0, 0.02, 0.16, 0.58, light);
  for (const z of [-0.76, 0.76])
    link('wiper', [8.845, 3.27, z - 0.25], [8.7, 3.67, z + 0.2], 0.045, 0.04, frame);

  return model;
}
