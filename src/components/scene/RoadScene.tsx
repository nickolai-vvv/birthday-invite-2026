"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, useGLTF } from "@react-three/drei";
import { memo, Suspense, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { createRacerTraffic } from "@/lib/scene/racer-traffic";
import { createManipulator } from "@/lib/scene/forest-lorry";
import { createLogTruck } from "@/lib/scene/forest-log-truck";
import { createGazelle } from "@/lib/scene/forest-gazelle";
import GarageWorkshop from "@/components/scene/GarageWorkshop";
import PartyScene from "@/components/scene/PartyScene";
import TireMarks from "@/components/scene/TireMarks";
import RoadFurniture from "@/components/scene/RoadFurniture";
import HighwayHomes from "@/components/scene/HighwayHomes";
import ApartmentBackdrop from "@/components/scene/ApartmentBackdrop";
import { BoxBatch, turnLines, DirtDetails } from "@/components/scene/SceneryBatches";

import {RACE,stepRace,racePose,type Race} from "@/lib/scene/race";
import { driveAt } from "@/lib/scene/drive";

function Block({ at, size, color }: { at:[number,number,number], size:[number,number,number], color:string }) {
  return <RoundedBox position={at} args={size} radius={.035} smoothness={2}><meshStandardMaterial color={color} metalness={.45} roughness={.35} /></RoundedBox>;
}

function Sonata({ distance = 0, paint = '#132b4b', race }: { distance?: number, paint?:string, race?:Race }) {
  const { scene } = useGLTF(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/models/sonata-prepared.glb`);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const adjust = (source: THREE.Material) => {
        const material = source.clone() as THREE.MeshPhysicalMaterial;
        material.transmission = 0;
        if (material.name === 'carpaint') {
          material.color.set(paint); material.metalness = .55; material.roughness = .26;
          material.clearcoat = 1; material.clearcoatRoughness = .15;
          material.envMapIntensity = .65;
        }
        if (material.name === 'clearglass') {
          material.color.set('#e8f2fa'); material.transmission = 0;
          material.transparent = true; material.opacity = .2; material.depthWrite = false;
          material.metalness = .08; material.roughness = .06; material.envMapIntensity = 1.8;
        }
        if (material.name === 'mattemetal' || material.name.startsWith('chrome')) {
          material.transmission = 0; material.color.set('#d5dce2');
          material.metalness = .9; material.roughness = .16; material.envMapIntensity = 1.4;
        }
        if (material.name === 'windowglass') {
          material.color.set('#080f18'); material.metalness = .12; material.roughness = .23;
          material.transmission = 0; material.transparent = false; material.opacity = 1;
          material.depthWrite = true; material.envMapIntensity = .35;
        }
        return material;
      };
      object.material = Array.isArray(object.material) ? object.material.map(adjust) : adjust(object.material);
    });
    return copy;
  }, [scene,paint]);
  const wheels = useMemo(() => {
    const result: THREE.Object3D[] = [];
    model.traverse(object => { if(object.userData.spinning) result.push(object); });
    return result;
  }, [model]);
  useFrame(() => { for (const wheel of wheels) wheel.rotation.x = (race && ["SHASHKI","APPROACH","CRASH"].includes(race.mode) ? driveAt(RACE.choice).distance+race.distance : distance)/.33;  });
  return <primitive object={model} />;
}
const trafficTemplates=new Map<number,THREE.Group>();
const Traffic = memo(function Traffic({ x,z,variant,distance,oncoming=false,race,index,fade=1 }: {x:number,z:number,variant:0|1|2|3|4|5|6,distance:number,oncoming?:boolean,race?:Race,index?:number,fade?:number}) {
 const root=useRef<THREE.Group>(null);
  const model=useMemo(()=>{
    
    const cached=trafficTemplates.get(variant);if(cached)return cached.clone(true);
    const g=variant>=4 ? createRacerTraffic(variant-4) : variant===3 ? createLogTruck() : variant===0 ? createManipulator(false,{crane:false,color:0xd3d1c5}) : createGazelle();
    g.traverse(o=>{if(o instanceof THREE.Mesh){const m=o.material as THREE.MeshStandardMaterial;if(m.color?.getHex()===0xe5e5da){o.material=m.clone();(o.material as THREE.MeshStandardMaterial).color.set(['#d3d1c5','#773d35','#687e82'][variant]);}}});
    g.rotation.y=variant>=4?0:variant===3?-Math.PI/2:Math.PI/2;g.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(g),scale=(variant>=4?[4.05,4.6,5.1][variant-4]:variant===3?11:variant===0 ? 8.5 : 5)/bounds.getSize(new THREE.Vector3()).z;g.scale.setScalar(scale);g.updateMatrixWorld(true);
    const fit=new THREE.Box3().setFromObject(g),center=fit.getCenter(new THREE.Vector3());g.position.set(-center.x,-fit.min.y,-center.z);
    trafficTemplates.set(variant,g);return g.clone(true);
  },[variant]);
  const fadingMaterials=useMemo(()=>{const materials:THREE.Material[]=[];const clone=(m:THREE.Material)=>{const copy=m.clone();copy.onBeforeCompile=m.onBeforeCompile;copy.customProgramCacheKey=m.customProgramCacheKey;return copy;};model.traverse(o=>{if(o instanceof THREE.Mesh){o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.push(m);}});return materials;},[model]);
  const wheels=useMemo(()=>{const a:THREE.Object3D[]=[];model.traverse(o=>{if(['traffic-wheel','rim','hub','wheel-rim','wheel-hub'].includes(o.name))a.push(o);});return a;},[model]);
  useFrame(()=>{const opacity=race?1-THREE.MathUtils.smoothstep(race.time,28,30):fade;for(const m of fadingMaterials){const transparent=opacity<.999;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=opacity;}const c=race?.cars.find(c=>c.id===(index??0));let d=distance;if(race&&root.current){root.current.visible=!!c&&Math.abs(c.z-race.distance)<310;if(c){root.current.position.set(c.x,0,driveAt(RACE.choice).z-c.z);root.current.rotation.y=(c.oncoming?Math.PI:0)+(c.yaw??0);d=c.z;}}for(const o of wheels){if(o.name==='traffic-wheel')o.rotation.x=-d/.34;else o.rotation.y=d/.33;}});
  return <group ref={root} {...(race?{}:{position:[x,0,z] as [number,number,number],rotation:[0,oncoming ? Math.PI:0,0] as [number,number,number]})}><primitive object={model} /></group>;
});

const smooth = (p:number,a:number,b:number) => THREE.MathUtils.smoothstep(p,a,b);
const Garage=memo(function Garage({ z, open=false, roof=1, gate=1 }: {z:number,open?:boolean,roof?:number,gate?:number}) {
  return <group position={[8,0,z]} rotation={[0,-Math.PI/2,0]} scale={[open?1.5:1,1,1]}>
    <Block at={[0,1.4,-8]} size={[4,2.8,.2]} color="#a69d8f" />
    {[-2,2].map(x=><Block key={x} at={[x,1.4,-4]} size={[.16,2.8,8]} color="#aaa193" />)}
    <mesh position={[0,2.85,-4]} visible={roof>.001}><boxGeometry args={[4.15,.15,8.2]} /><meshStandardMaterial color="#777e77" transparent opacity={roof} depthWrite={roof>.99} roughness={.9} /></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.006,-4]}><planeGeometry args={[3.83,7.85]} /><meshStandardMaterial color="#727578" roughness={.96} /></mesh>
    {[-1,1].map(side=><group key={side} position={[side*1.95,0,0]} rotation={[0,open ? gate*side*Math.PI*.7 : 0,0]}>
      <Block at={[-side*.96,1.35,0]} size={[1.92,2.7,.08]} color={open ? '#855239' : ['#466981','#803f38','#777e64','#91684e'][Math.abs(Math.round(z/4.15))%4]} />
      <Block at={[-side*1.75,1.3,.06]} size={[.05,.2,.05]} color="#bbc1b9" />
    </group>)}
    {open && <><GarageWorkshop /><Block at={[0,.8,-4.5]} size={[1.1,.1,3]} color="#927653" />
      {[-.43,.43].map(x=>[-3.3,-5.7].map(z=><Block key={`${x}-${z}`} at={[x,.4,z]} size={[.08,.8,.08]} color="#66513b" />))}
      <pointLight position={[0,2.4,-4]} intensity={7} distance={8} color="#fff0d9" />
    </>}
  </group>;
});
function RoadsideTrees({zone,offset,extension}: {zone:number,offset:number,extension:number}) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if(!trunks.current||!crowns.current)return;
    const transform = new THREE.Object3D();
    let count=0;
    for (let i=0;i<120;i++) {
      const row = i%2;
      const z = 45-Math.floor(i/2)*10;
      if(z>zone+45 || z<zone-300)continue;
      // End the planted verge before the junction and garage access.
      if(z+offset < -220-extension)continue;
      // Keep the full crown in the verge: nearest facade begins at x=23.
      const x = (row ? -1 : 1)*(15+(i%3)*1.1);
      const height = 3.3+(i%4)*.35;
      transform.position.set(x,height/2,z);transform.scale.set(1,height/4,1);transform.updateMatrix();
      trunks.current!.setMatrixAt(count,transform.matrix);
      transform.position.set(x,height+.5,z);transform.scale.setScalar(1+(i%3)*.15);transform.updateMatrix();
      crowns.current!.setMatrixAt(count,transform.matrix);
      crowns.current!.setColorAt(count,new THREE.Color(i%3 ? '#687f51':'#82915f'));count++;
    }
    trunks.current!.count=count;crowns.current!.count=count;
    trunks.current!.instanceMatrix.needsUpdate=true;
    crowns.current!.instanceMatrix.needsUpdate=true;
    if(crowns.current!.instanceColor)crowns.current!.instanceColor.needsUpdate=true;
    trunks.current!.computeBoundingSphere();crowns.current!.computeBoundingSphere();
  },[zone,offset,extension]);
  return <>
    <instancedMesh ref={trunks} args={[undefined,undefined,120]}><cylinderGeometry args={[.15,.22,4,7]} /><meshStandardMaterial color="#72624b" roughness={1} /></instancedMesh>
    <instancedMesh ref={crowns} args={[undefined,undefined,120]}><sphereGeometry args={[1.8,10,8]} /><meshStandardMaterial roughness={1} /></instancedMesh>
  </>;
}

function GarageDistrict({p}: {p:number}) {
  return <group position={[0,0,-160.75]}>
    <Garage z={-190} open gate={smooth(p,.845,.87)} roof={1-smooth(p,.87,.90)} />
    {Array.from({length:6},(_,i)=><Garage key={`l${i}`} z={-191-(i+1)*4.15} />)}
    {Array.from({length:10},(_,i)=><Garage key={`r${i}`} z={-189+(i+1)*4.15} />)}
  </group>;
}
const StaticTrees = memo(RoadsideTrees);
const StaticGarages = memo(GarageDistrict);
const RoadTurn = memo(function RoadTurn() {
  const geometry = useMemo(() => {
    const positions:number[]=[],indices:number[]=[];
    for(let i=0;i<=100;i++) {
      const angle=i/100*Math.PI/2;
      for(const radius of [40,50]) positions.push(45-radius*Math.cos(angle),.001,-238-radius*Math.sin(angle));
      if(i<100){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  },[]);
  return <group>
    <mesh geometry={geometry}><meshStandardMaterial color="#63676b" roughness={1} side={THREE.DoubleSide} /></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[195,.001,-283]}><planeGeometry args={[300,10]} /><meshStandardMaterial color="#63676b" roughness={1} /></mesh>
    <BoxBatch items={turnLines} color="#eee9d8" />
    {[-4.6,4.6].map(offset=><Block key={offset} at={[195,.014,-283+offset]} size={[300,.012,.075]} color="#eee9d8" />)}
  </group>;
});
const extendedLines=Array.from({length:450},(_,i)=>({x:0,y:.015,z:37-i*6,sx:.075,sy:.018,sz:2.6}));
function World({ progress, onReady,race,onRace }: { progress:number,onReady:()=>void,race:Race,onRace:()=>void }) {
  const { camera, size, invalidate, gl, scene } = useThree();
  useEffect(()=>{
    let cancelled=false;
    const prepare=async()=>{
      const hidden:THREE.Object3D[]=[];
      scene.traverse(o=>{if(!o.visible){hidden.push(o);o.visible=true;}});
      try{await gl.compileAsync(scene,camera);
        if(!cancelled){
          const target=new THREE.WebGLRenderTarget(128,128),previous=gl.getRenderTarget();
          const warm=new THREE.PerspectiveCamera(65,1,.1,4000);
          try{for(const z of [0,-250,-2450]){warm.position.set(12,8,z+20);warm.lookAt(8,1,z);gl.setRenderTarget(target);gl.render(scene,warm);}}
          finally{gl.setRenderTarget(previous);target.dispose();}
        }
      }finally{hidden.forEach(o=>{o.visible=false;});}
      if(!cancelled){invalidate();requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!cancelled)onReady();}));}
    };
    prepare();return()=>{cancelled=true;};
  },[gl,scene,camera,invalidate,onReady]);
  useEffect(() => { invalidate(); }, [progress,race.mode,invalidate]);
  const keys=useRef(new Set<string>());
  useEffect(()=>{const down=(e:KeyboardEvent)=>{if(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"].includes(e.code)){keys.current.add(e.code);if(race.mode==="SHASHKI")e.preventDefault();}};const up=(e:KeyboardEvent)=>keys.current.delete(e.code);const clear=()=>keys.current.clear();window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",clear);return ()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",clear);};},[race]);
  const carRoot=useRef<THREE.Group>(null),shadow=useRef<THREE.Mesh>(null);
  const sceneClock=useRef(0);
  const p=progress;
  const followStart=useMemo(()=>{
    const view=new THREE.PerspectiveCamera(44,size.width/size.height,.1,2000);
    view.position.set(-5,22,8);view.lookAt(0,0,-4);view.updateMatrixWorld(true);
    let lo=0,hi=.2;
    for(let i=0;i<30;i++){
      const t=(lo+hi)/2,z=driveAt(t).z;
      const front=new THREE.Vector3(2.25,1,z-2.4).project(view);
      const rear=new THREE.Vector3(2.25,1,z+2.4).project(view);
      if(front.y>=.92-Math.abs(front.y-rear.y)*.5)hi=t;else lo=t;
    }
    return hi;
  },[size.width,size.height]);
  const extension=race.mode==='DONE'&&p<.53?RACE.extension:race.routeExtension;
  const roadLines=useMemo(()=>extendedLines.filter(line=>line.z>=-238-extension),[extension]);
  const profileAngle=smooth(p,RACE.choice+.025,.52)*Math.PI/2*(1-race.blend*(1-smooth(p,RACE.choice,.48)));
  const base=driveAt(p);
  const {x,z,distance,yaw}=racePose(race,p),trafficDistance=base.trafficDistance;
  const rough=smooth(p,.70,.73)*(1-smooth(p,.80,.84));
  const bump=rough*(Math.sin(distance*2.8)*.018+Math.sin(distance*5)*.006);
  useFrame((_,delta)=>{
    const previous=race.mode;
    if(race.mode==="SHASHKI"||race.mode==="APPROACH"||(race.mode==="CRASH"&&race.impact<1.2)){
      if(!document.hidden)stepRace(race,Math.min(delta,.05),new Set([...keys.current,...race.touchKeys]));
      sceneClock.current+=delta;
      if(previous!==race.mode||sceneClock.current>.25){sceneClock.current=0;onRace();}invalidate();
    }
    const pose=racePose(race,p),{x,z}=pose;
    if(carRoot.current){carRoot.current.position.set(x,bump+race.curbPulse*.025,z);carRoot.current.rotation.set(pose.pitch+rough*Math.sin(distance*2)*.006,pose.yaw,-Math.sign(x)*race.curbPulse*.012);}
    if(shadow.current)shadow.current.position.set(x,.009,z);
    const follow=smooth(p,Math.max(0,followStart-.055),followStart+.015), side=smooth(p,RACE.choice+.025,.52);
    const angle=side*Math.PI/2*(1-race.blend*(1-smooth(p,RACE.choice,.48)));
    // Fit the width of the car, not the viewport height. Rear view stays close on phones.
    const aspect=size.width/size.height;
    const visibleWidth=2.1*Math.cos(angle)+4.85*Math.sin(angle);
    const fitRange=visibleWidth/(2*Math.tan(22*Math.PI/180)*aspect*.84);
    const range=Math.max(aspect<.8?9:11,fitRange);
    const chase=new THREE.Vector3(x-Math.sin(angle)*range,THREE.MathUtils.lerp(2.8,1.6,side),z+Math.cos(angle)*range);
    const position=new THREE.Vector3(-5,22,8).lerp(chase,follow);
    const aim=new THREE.Vector3(0,0,-4).lerp(new THREE.Vector3(x,1,z),follow);
    const overhead=THREE.MathUtils.smootherstep(p,.855,.887);
    position.lerp(new THREE.Vector3(12,8.8,-350.65-extension),overhead);
    aim.lerp(new THREE.Vector3(12.5,0,-350.75-extension),overhead);
    const enter=THREE.MathUtils.smootherstep(p,.892,.914);
    position.lerp(new THREE.Vector3(15.4,1.65,-350.75-extension),enter);
    aim.lerp(new THREE.Vector3(8.8,.85,-350.75-extension),enter);
    // Portrait phones: frame the guest above the description, rather than empty sky.
    if(size.width<=650 && size.height>size.width){
      position.lerp(new THREE.Vector3(13.4,1.5,-350.75-extension),enter);
      aim.lerp(new THREE.Vector3(9.3,.95,-350.75-extension),enter);
    }
    const toastCamera=smooth(p,.985,.994);
    position.lerp(new THREE.Vector3(9.2,5.3,-352.6-extension),toastCamera);
    aim.lerp(new THREE.Vector3(12.8,.85,-350.75-extension),toastCamera);
    const boost=Math.max(0,(race.speed*3.6-200)/20);
    position.x+=Math.sin(race.time*47)*.018*boost;
    position.y+=Math.sin(race.time*61)*.012*boost;
    if(race.mode==='CRASH'){
      const travel=10*smooth(race.impact,0,1.2);
      position.z-=travel;aim.z-=travel*.45;
    }
    position.x+=Math.sign(x)*race.curbPulse*.035;
    camera.position.copy(position);camera.lookAt(aim);
  },-1);
  return <>
    {Array.from({length:12},(_,i)=><Traffic key={`race-${i}`} x={0} z={0} variant={[4,1,5,0,6,3,5,4,6,1,4,5][i] as 0|1|2|3|4|5|6} distance={0} race={race} index={i}/>)}
    <Environment resolution={128} frames={1}>
      <Lightformer position={[0,8,0]} rotation={[Math.PI/2,0,0]} scale={[25,25,1]} intensity={2} color="#edf5ff" />
      <Lightformer position={[-8,3,0]} rotation={[0,Math.PI/2,0]} scale={[15,5,1]} intensity={3} color="#dceaff" />
      <Lightformer position={[8,4,0]} rotation={[0,-Math.PI/2,0]} scale={[15,5,1]} intensity={2} color="#fff0db" />
      <Lightformer position={[0,3,10]} rotation={[0,Math.PI,0]} scale={[20,6,1]} intensity={2} />
    </Environment>
    <color attach="background" args={["#c4d8e4"]} /><fog attach="fog" args={["#c4d8e4",135,300]} />
    <hemisphereLight args={["#dbe7f5","#697151",1.05]} /><directionalLight position={[-20,30,15]} intensity={1.65} color="#fff0d8" />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.05,-1100]}><planeGeometry args={[1800,4400]} /><meshStandardMaterial color="#7e8d62" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,-99-extension/2]}><planeGeometry args={[10,278+extension]} /><meshStandardMaterial color="#63676b" roughness={1} /></mesh>
    {[-4.6,4.6].map(a=><Block key={a} at={[a,.012,-99-extension/2]} size={[.075,.018,278+extension]} color="#eee9d8" />)}
    <BoxBatch items={roadLines} color="#eee9d8" />
    <group position={[0,0,-extension]}><RoadTurn /></group>
    {p>.48 && <>
      <mesh rotation={[-Math.PI/2,0,0]} position={[2,-.015,-443-extension]}><planeGeometry args={[14,410]} /><meshStandardMaterial color="#9d8d70" roughness={1} /></mesh>
      <group position={[0,0,-extension]}><DirtDetails zone={Math.ceil((z+extension)/20)*20} /></group>
    </>}
    {p<.975 && Array.from({length:6},(_,i)=><group key={i} position={[0,0,-i*500]}><StaticTrees offset={-i*500} extension={extension} zone={p<.18?20:Math.ceil((z+i*500)/20)*20} /></group>)}
    <TireMarks race={race} progress={p}/>
    <RoadFurniture extension={extension} hideLeft={profileAngle>=Math.PI*.45}/>
    <HighwayHomes extension={race.routeExtension} progress={p}/>
    {p<.975 && <group position={[0,0,-extension]}><ApartmentBackdrop /></group>}
    <mesh ref={shadow} position={[x,.009,z]} rotation={[-Math.PI/2,0,0]} scale={[1.1,2.35,1]}><circleGeometry args={[1,48]} /><meshBasicMaterial color="#20231d" transparent opacity={.19} depthWrite={false} /></mesh><group ref={carRoot} visible={p<.978} position={[x,bump,z]} rotation={[rough*Math.sin(distance*2)*.006,yaw,0]}><Sonata distance={distance} race={race} /></group>
    {p<.64 && -25-trafficDistance<z+35 && <Traffic fade={1-smooth(p,.57,.63)} x={2.25} z={-25-trafficDistance} variant={0} distance={trafficDistance} />}
    {p<.64 && -38-trafficDistance<z+35 && <Traffic fade={1-smooth(p,.57,.63)} x={2.25} z={-38-trafficDistance} variant={1} distance={trafficDistance} />}
    {p<.33 && -70+p*340<z+35 && <Traffic x={-2.25} z={-70+p*340} variant={2} distance={p*340} oncoming />}
    {p<.33 && -125+p*340<z+35 && <Traffic x={-2.25} z={-125+p*340} variant={3} distance={p*340} oncoming />}
    <group position={[0,0,-extension]}><StaticGarages p={p<.845?0:p>.90?1:p} /></group>
    {<group visible={p>.878} position={[0,0,-160.75-extension]}><PartyScene p={p} /></group>}
  </>;
}
export default function RoadScene({ progress,onReady,race,onRace }: { progress:number,onReady:()=>void,race:Race,onRace:()=>void }) {
  return <Canvas frameloop="demand" camera={{ position:[-5,22,8], fov:44 }} dpr={1}><Suspense fallback={null}><World progress={progress} onReady={onReady} race={race} onRace={onRace} /></Suspense></Canvas>;
}





















