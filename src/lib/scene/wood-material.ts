import * as THREE from 'three';

const noiseGLSL = `
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float grain(vec3 p){
 vec2 center=vec2(-.09,.07)+vec2(sin(p.z*.65),cos(p.z*.8))*.018;
 vec2 q=p.xy-center;float a=atan(q.y,q.x);
 float r=length(q)*(1.+.022*sin(a*5.)+.013*sin(a*9.+1.));
 r+=.012*noise3(vec3(p.xy*8.,p.z*.35));
 return r*26.+.22*sin(r*17.)+.14*sin(r*41.);
}
float barkHeight(vec3 p){
 float a=atan(p.y,p.x);vec3 q=vec3(cos(a)*9.,sin(a)*9.,p.z*1.7);
 float warp=noise3(q*.55);float v=sin(a*43.+warp*5.+.45*sin(p.z*3.));
 float fissure=pow(1.-abs(v),12.);
 float crossCrack=pow(1.-abs(sin(p.z*10.+noise3(q)*5.)),18.);
 return .55+.25*noise3(q*2.)-.48*fissure-.14*crossCrack+.06*noise3(q*9.);
}`;

function material(kind: 'wood' | 'bark') {
  const m = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: kind === 'bark' ? 0.98 : 0.83,
  });
  m.onBeforeCompile = (s) => {
    // При обрезке скруглений рисунок следует текущему сечению, как у готовой доски.
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 timberP;')
      .replace(
        '#include <morphtarget_vertex>',
        '#include <morphtarget_vertex>\ntimberP=transformed;',
      );
    s.fragmentShader = s.fragmentShader.replace(
      '#include <common>',
      `#include <common>\nvarying vec3 timberP;\n${noiseGLSL}`,
    );
    const color =
      kind === 'bark'
        ? `
 float relief=barkHeight(timberP);
 float mottling=noise3(timberP*vec3(4.,4.,1.5));
 vec3 barkColor=mix(vec3(.018,.009,.005),vec3(.105,.065,.033),smoothstep(.24,.8,relief));
 barkColor=mix(barkColor,vec3(.10,.085,.065),smoothstep(.55,.85,mottling)*.48);
 diffuseColor.rgb*=barkColor;
 `
        : `
 float g=grain(timberP);
 float ringWidth=max(fwidth(g)*.6,.025);
 float ringDistance=abs(fract(g)-.72);
 float late=1.-smoothstep(.055,.055+ringWidth,ringDistance);
 late=mix(late,.14,smoothstep(.3,1.,fwidth(g)));
 float fibre=noise3(timberP*vec3(70.,70.,.45));
 float r=length(timberP.xy-vec2(-.09,.07));
 vec3 timberColor=mix(vec3(.32,.17,.068),vec3(.46,.29,.13),smoothstep(.6,1.,r));
 timberColor*=1.-late*.4;
 timberColor*=.97+fibre*.06;
 diffuseColor.rgb*=timberColor;
 `;
    s.fragmentShader = s.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\n' + color,
    );
    s.fragmentShader = s.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
 float surfaceHeight=${kind === 'bark' ? 'barkHeight(timberP)*.018' : '0.'};
 vec3 sx=dFdx(vViewPosition),sy=dFdy(vViewPosition);
 vec3 r1=cross(sy,normal),r2=cross(normal,sx);
 float det=dot(sx,r1);
 normal=normalize(abs(det)*normal-sign(det)*(dFdx(surfaceHeight)*r1+dFdy(surfaceHeight)*r2));
 `,
    );
  };
  m.customProgramCacheKey = () => kind;
  return m;
}
export const wood = material('wood');

// Вариации только для складских штабелей. Цвет экземпляра сохраняется при
// объединении паллетов и задаёт постоянный рисунок без новых текстур и геометрии.
function createWarehouseWood() {
  const result = material('wood');
  const compile = result.onBeforeCompile;
  result.onBeforeCompile = (shader, renderer) => {
    compile.call(result, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('varying vec3 timberP;', 'varying vec3 timberP; varying vec3 stockGrainP;')
      .replace(
        'timberP=transformed;',
        `timberP=position;
 stockGrainP=position;
 #ifdef USE_INSTANCING_COLOR
 vec3 seed=fract(instanceColor*vec3(17.13,31.71,53.19));
 stockGrainP.xy=position.xy*mix(.88,1.12,seed.x)+(seed.yz-.5)*.56;
 stockGrainP.z=position.z*mix(.9,1.1,seed.y)+seed.z*9.;
 #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('varying vec3 timberP;', 'varying vec3 timberP; varying vec3 stockGrainP;')
      .replace('grain(timberP)', 'grain(stockGrainP)')
      .replace('noise3(timberP*vec3(70.,70.,.45))', 'noise3(stockGrainP*vec3(70.,70.,.45))');
  };
  result.customProgramCacheKey = () => 'warehouse-wood';
  return result;
}
export const warehouseWood = createWarehouseWood();

// Малый разброс яркости груза на машинах.
export function timberTone(index: number) {
  return 1 + Math.sin((index + 1) * 2.39996) * 0.04;
}
export function tintStock(mesh: THREE.InstancedMesh, seed = 0) {
  const color = new THREE.Color();
  let state = (73421 + seed) >>> 0;
  const random = () => (state = (state * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < mesh.count; i++) {
    const tone = 1 + (random() - 0.5) * 0.1;
    const warmth = (random() - 0.5) * 0.024;
    mesh.setColorAt(i, color.setRGB(tone + warmth, tone, tone - warmth));
  }
}

// После объединения деталей рисунок остаётся в локальных координатах каждой доски.
export function createCargoWood() {
  const result = material('wood');
  result.vertexColors = true;
  const compile = result.onBeforeCompile;
  result.onBeforeCompile = (shader, renderer) => {
    compile.call(result, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('varying vec3 timberP;', 'varying vec3 timberP; attribute vec3 timberPosition;')
      .replace('timberP=transformed;', 'timberP=timberPosition;');
  };
  result.customProgramCacheKey = () => 'cargo-wood';
  return result;
}
