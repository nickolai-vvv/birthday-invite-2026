import * as THREE from 'three';

const MANIPULATOR_GROUND = 0;

export function createGazelle() {
  const model = new THREE.Group();
  model.name = 'gazelle';
  const paint = new THREE.MeshStandardMaterial({ color: 0xe5e5da, roughness: 0.62 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x303a3b, roughness: 0.8 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x272c2c, roughness: 0.98 });
  const metal = new THREE.MeshStandardMaterial({
    color: 0x909a99,
    metalness: 0.35,
    roughness: 0.48,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x405e64,
    roughness: 0.28,
    side: THREE.DoubleSide,
  });
  const canvas = new THREE.MeshStandardMaterial({ color: 0x7c8e86, roughness: 0.98 });
  const seam = new THREE.MeshStandardMaterial({ color: 0x71817a, roughness: 1 });
  const light = new THREE.MeshStandardMaterial({ color: 0xeee9d9, roughness: 0.35 });
  const rear = new THREE.MeshStandardMaterial({ color: 0xa84f38, roughness: 0.55 });
  const add = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.y = MANIPULATOR_GROUND;
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
    const mesh = add(name, new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, MANIPULATOR_GROUND + y, z);
    return mesh;
  };
  const cylinder = (
    name: string,
    x: number,
    y: number,
    z: number,
    r: number,
    depth: number,
    material: THREE.Material,
  ) => {
    const mesh = add(name, new THREE.CylinderGeometry(r, r, depth, 16), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, MANIPULATOR_GROUND + y, z);
    return mesh;
  };
  for (const z of [-0.88, 0.88]) box('chassis', 0.2, 1.04, z, 10.2, 0.23, 0.14, dark);
  for (const x of [-4.1, -2.3, 0, 2.1, 4.65]) box('crossmember', x, 1.08, 0, 0.13, 0.2, 2.6, dark);
  for (const x of [-2.3, 4.65]) {
    cylinder('axle', x, 0.64, 0, 0.1, 2.9, dark);
    for (const side of [-1, 1]) {
      const tyre = add('tyre', new THREE.TorusGeometry(0.46, 0.18, 8, 20), rubber);
      tyre.position.set(x, MANIPULATOR_GROUND + 0.64, side * 1.37);
      cylinder('rim', x, 0.64, side * 1.48, 0.35, 0.18, metal);
      cylinder('hub', x, 0.64, side * 1.58, 0.15, 0.07, dark);
      box('suspension', x, 0.98, side * 0.88, 1.2, 0.09, 0.22, dark);
    }
  }
  box('deck', -1.05, 1.39, 0, 7.2, 0.22, 3.05, metal);
  for (const side of [-1, 1]) {
    box('sideboard', -1.05, 1.84, side * 1.49, 7.2, 0.68, 0.08, paint);
    box('sideboard-rail', -1.05, 2.19, side * 1.5, 7.3, 0.07, 0.11, metal);
    for (const x of [-4.58, -2.25, 0.1, 2.5])
      box('sideboard-post', x, 1.84, side * 1.55, 0.07, 0.73, 0.06, metal);
    box('rear-fender', -2.3, 1.38, side * 1.42, 1.75, 0.1, 0.4, dark);
    box('mudflap', -3.13, 0.73, side * 1.43, 0.07, 0.62, 0.45, rubber);
    box('step', 3.05, 0.72, side * 1.4, 0.62, 0.13, 0.35, metal);
    box('fuel-tank', 0.55, 0.97, side * 1.03, 1.15, 0.55, 0.56, dark);
  }
  box('tailgate', -4.68, 1.84, 0, 0.1, 0.68, 2.98, paint);
  box('rear-bumper', -4.78, 0.91, 0, 0.14, 0.18, 2.73, dark);
  for (const side of [-1, 1]) box('tail-light', -4.77, 1.28, side * 1.13, 0.08, 0.16, 0.37, rear);

  // Тент с округлёнными верхними плечами, швами и креплениями к бортам.
  const tentSection = new THREE.Shape();
  tentSection.moveTo(-1.51, 2.22);
  tentSection.lineTo(-1.51, 4.71);
  tentSection.quadraticCurveTo(-1.5, 5.03, -1.16, 5.07);
  tentSection.lineTo(1.16, 5.07);
  tentSection.quadraticCurveTo(1.5, 5.03, 1.51, 4.71);
  tentSection.lineTo(1.51, 2.22);
  tentSection.closePath();
  const tent = add(
    'canvas-body',
    new THREE.ExtrudeGeometry(tentSection, { depth: 7.15, bevelEnabled: false, curveSegments: 4 }),
    canvas,
  );
  tent.rotation.y = Math.PI / 2;
  tent.position.x = -4.65;
  for (const side of [-1, 1]) {
    for (const x of [-4.42, -3.2, -1.9, -0.6, 0.7, 2.26]) {
      box('canvas-seam', x, 3.45, side * 1.52, 0.025, 2.4, 0.012, seam);
      box('canvas-tie', x, 2.2, side * 1.55, 0.035, 0.28, 0.027, dark);
    }
    box('canvas-hem', -1.07, 2.3, side * 1.526, 7.1, 0.07, 0.018, seam);
  }
  for (const z of [-1.35, 0, 1.35])
    box('rear-canvas-seam', -4.67, 3.55, z, 0.025, 2.5, 0.035, seam);

  // Короткий капот и наклонное стекло задают силуэт лёгкого грузовика.
  const outline = new THREE.Shape();
  outline.moveTo(2.67, 1.03);
  outline.lineTo(2.67, 3.48);
  outline.quadraticCurveTo(2.72, 3.86, 3.1, 3.89);
  outline.lineTo(4.42, 3.89);
  outline.lineTo(5.15, 2.45);
  outline.lineTo(5.82, 2.11);
  outline.quadraticCurveTo(5.97, 2.02, 5.97, 1.75);
  outline.lineTo(5.92, 1.02);
  outline.lineTo(5.37, 1.02);
  outline.quadraticCurveTo(5.3, 1.42, 4.65, 1.43);
  outline.quadraticCurveTo(4.02, 1.42, 3.93, 1.02);
  outline.closePath();
  const cab = add(
    'cab',
    new THREE.ExtrudeGeometry(outline, {
      depth: 2.65,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 1,
      curveSegments: 6,
    }),
    paint,
  );
  cab.position.z = -1.325;
  const window = new THREE.Shape();
  window.moveTo(2.95, 2.51);
  window.lineTo(2.95, 3.6);
  window.lineTo(4.28, 3.6);
  window.lineTo(4.83, 2.51);
  window.closePath();
  for (const side of [-1, 1]) {
    add('side-window', new THREE.ShapeGeometry(window), glass).position.z = side * 1.37;
    box('window-pillar', 4.03, 3.04, side * 1.39, 0.055, 1.15, 0.025, paint);
    box('door-handle', 3.19, 2.26, side * 1.39, 0.27, 0.07, 0.05, dark);
    box('door-seam', 2.86, 1.76, side * 1.37, 0.02, 0.9, 0.015, dark);
    box('mirror-arm', 4.7, 2.86, side * 1.58, 0.06, 0.06, 0.48, dark);
    box('mirror', 4.7, 2.84, side * 1.79, 0.13, 0.46, 0.23, dark);
    box('mirror-pane', 4.625, 2.84, side * 1.79, 0.015, 0.36, 0.17, glass);
    box('headlight', 6.01, 1.78, side * 0.98, 0.08, 0.31, 0.54, light);
  }
  const windshield = new THREE.BufferGeometry();
  windshield.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        5.16, 2.55, -1.11, 4.62, 3.61, -1.11, 4.62, 3.61, 1.11, 5.16, 2.55, -1.11, 4.62, 3.61, 1.11,
        5.16, 2.55, 1.11,
      ],
      3,
    ),
  );
  windshield.computeVertexNormals();
  add('windshield', windshield, glass);
  for (const z of [-0.52, 0.52]) {
    const wiper = box('wiper', 5.02, 2.85, z, 0.04, 0.5, 0.035, dark);
    wiper.rotation.z = 0.47;
  }
  box('grille', 6.02, 1.71, 0, 0.07, 0.48, 1.15, dark);
  for (const y of [1.59, 1.78]) box('grille-bar', 6.065, y, 0, 0.03, 0.035, 1.03, metal);
  box('bumper', 5.97, 1.05, 0, 0.24, 0.32, 2.8, dark);
  box('number-plate', 6.105, 1.11, 0, 0.02, 0.15, 0.48, light);

  return model;
}
