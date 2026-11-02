import * as THREE from 'three';
import {createTruckCab} from '@/lib/scene/truck-cab';
const TRUCK_HITCH_X=-3.45,TRUCK_STAKES=[-4.35,-1.6,1.6,5.75];
export function createLogTruck(){const root=new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: 0xe7e8e1, roughness: 0.48 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xcf6339, roughness: 0.5 });
  const metal = new THREE.MeshStandardMaterial({
    color: 0x495455,
    metalness: 0.45,
    roughness: 0.5,
  });
  const deck = new THREE.MeshStandardMaterial({ color: 0x3c5055, roughness: 0.7, metalness: 0.3 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x232a2a, roughness: 1 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x37525d,
    side: THREE.DoubleSide,
    metalness: 0.35,
    roughness: 0.16,
  });
  const lamp = new THREE.MeshStandardMaterial({
    color: 0xfff4d4,
    emissive: 0xb8a76b,
    emissiveIntensity: 0.25,
  });
  function box(
    g: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
  ) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }
  function truck() {
    const g = new THREE.Group();
    g.name = 'delivery-tractor';
    const hitch = new THREE.Group(),
      body = new THREE.Group();
    hitch.name = 'trailer-hitch';
    body.name = 'log-trailer';
    hitch.position.x = TRUCK_HITCH_X;
    body.position.x = -TRUCK_HITCH_X;
    g.add(hitch);
    hitch.add(body);
    const silver = new THREE.MeshStandardMaterial({
      color: 0x9aa6a4,
      metalness: 0.55,
      roughness: 0.38,
    });
    const red = new THREE.MeshStandardMaterial({ color: 0xa44936, roughness: 0.55 });
    const cab = createTruckCab(
      {
        paint,
        frame: metal,
        steel: silver,
        glass,
        light: lamp,
        amber: orange,
      },
      0,
      { wheelArch: { centerY: 0.85, radius: 0.94 } },
    );
    cab.name = 'delivery-cab';
    cab.scale.set(0.8, 0.8, 0.78);
    cab.rotation.y = Math.PI;
    cab.position.set(-0.84, -2.7, 0);
    g.add(cab);
    // Рама тягача, ступени, баки и седло; шарнир остаётся на прежнем месте.
    for (const z of [-0.88, 0.88]) box(g, -5.35, -1.59, z, 6.25, 0.3, 0.18, metal);
    for (const x of [-7, -5.6, -4.6, -3.45]) box(g, x, -1.57, 0, 0.13, 0.23, 2.15, metal);
    box(g, TRUCK_HITCH_X, -1.32, 0, 1.1, 0.16, 1.5, metal);
    for (const side of [-1, 1]) {
      box(g, -5.53, -1.88, side * 1.1, 0.65, 0.13, 0.52, silver);
      box(g, -5.53, -1.58, side * 1.09, 0.65, 0.13, 0.43, silver);
      box(g, -5.1, -1.45, side * 0.86, 0.86, 0.69, 0.56, silver);
      for (const x of [-5.4, -4.8]) box(g, x, -1.45, side * 0.86, 0.075, 0.73, 0.6, metal);
      box(g, -3.8, -1.18, side * 1.17, 1.76, 0.13, 0.66, deck);
      box(g, -2.93, -1.91, side * 1.18, 0.08, 0.74, 0.63, rubber);
    }
    // Ходовая часть прицепа и доски настила не меняют посадку груза.
    for (const z of [-0.94, 0.94]) box(body, 0.95, -1.6, z, 11.9, 0.35, 0.17, metal);
    for (const x of [-4.7, -2.8, -0.6, 1.6, 3.9, 6.5])
      box(body, x, -1.56, 0, 0.14, 0.24, 2.75, metal);
    box(body, 0.95, -1.18, 0, 11.9, 0.24, 2.9, deck);
    for (const z of [-1.49, 1.49]) {
      box(body, 0.95, -1.11, z, 11.9, 0.15, 0.08, silver);
      box(body, 0.05, -1.99, z, 5.5, 0.13, 0.09, silver);
      for (const x of [-2.5, -0.1, 2.4]) box(body, x, -1.72, z, 0.09, 0.62, 0.07, metal);
      for (const x of [-4.55, -1.5, 1.8, 4.2, 6.4])
        box(body, x, -1.32, z * 1.014, 0.2, 0.09, 0.04, orange);
      box(body, 5.1, -1.2, z * 0.87, 3.95, 0.1, 0.62, deck);
      box(body, 6.94, -1.97, z * 0.88, 0.08, 0.79, 0.63, rubber);
    }
    box(body, 6.94, -2.07, 0, 0.16, 0.2, 2.6, silver);
    for (const z of [-1.13, 1.13]) box(body, 6.94, -1.45, z, 0.09, 0.22, 0.49, red);
    const tyreProfile = [
      [0.38, -0.18],
      [0.53, -0.18],
      [0.64, -0.13],
      [0.68, -0.06],
      [0.68, 0.06],
      [0.64, 0.13],
      [0.53, 0.18],
      [0.38, 0.18],
      [0.38, -0.18],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const tyreGeometry = new THREE.LatheGeometry(tyreProfile, 20);
    for (const x of [-7, -3.7, 3.9, 5.1, 6.3]) {
      const axleParent = x < 0 ? g : body;
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.7, 12), metal);
      axle.rotation.x = Math.PI / 2;
      axle.position.set(x, -2.02, 0);
      axleParent.add(axle);
      for (const side of [-1, 1]) {
        for (const offset of x === -7 ? [1.26] : [0.97, 1.34]) {
          const tyre = new THREE.Mesh(tyreGeometry, rubber);
          tyre.name = 'delivery-tyre';
          tyre.rotation.x = Math.PI / 2;
          tyre.position.set(x, -2.02, side * offset);
          axleParent.add(tyre);
        }
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.1, 16), silver);
        hub.rotation.x = Math.PI / 2;
        hub.position.set(x, -2.02, side * (x === -7 ? 1.45 : 1.53));
        hub.name='wheel-hub';axleParent.add(hub);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.15, 12), metal);
        cap.rotation.x = Math.PI / 2;
        cap.position.copy(hub.position);
        cap.position.z += side * 0.06;
        axleParent.add(cap);
      }
    }
    for (const x of TRUCK_STAKES)
      for (const z of [-1.42, 1.42]) {
        box(body, x, 0.72, z, 0.14, 3.8, 0.14, metal);
        box(body, x, -0.87, z, 0.25, 0.58, 0.25, deck);
        box(body, x, 2.63, z, 0.18, 0.06, 0.18, silver);
      }
    root.add(g);
    return { vehicle: g, hitch, body };
  }
  const { body: trailerBody } = truck();

const bark=new THREE.MeshStandardMaterial({color:'#69503b',roughness:1}),ends=new THREE.MeshStandardMaterial({color:'#c19b69',roughness:1});
for(const x of [-2.05,3.45])for(let row=0;row<3;row++)for(const z of [-.65,.65]){const log=new THREE.Mesh(new THREE.CylinderGeometry(.62,.65,5.36,12),[bark,ends,ends]);log.position.set(x,-.41+row*1.15,z);log.rotation.z=Math.PI/2;trailerBody.add(log);}
root.rotation.y=Math.PI;return root;}
