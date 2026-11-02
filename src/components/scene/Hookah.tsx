"use client";
import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';

export default function Hookah({active,reveal}:{active:boolean,reveal:number}){
 const smoke=useRef<T.Group>(null);
 const time=useRef(0);
 const hose=useMemo(()=>new T.CatmullRomCurve3([
  new T.Vector3(.05,.3,0),new T.Vector3(.28,.36,.04),
  new T.Vector3(.39,.06,.15),new T.Vector3(.2,.025,.3),new T.Vector3(-.1,.04,.28),
 ]),[]);
 useFrame((state,delta)=>{
  if(!active){time.current=0;return;}
  if(!smoke.current)return;
  time.current+=Math.min(delta,.05);
  smoke.current.children.forEach((child,i)=>{
   // A short burst every three seconds, followed by a quiet gap.
   const age=(time.current%3.2)-i*.065;
   const t=Math.max(0,Math.min(1,age/2.2));
   child.visible=age>=0&&age<2.2;
   child.position.set(Math.sin(t*5+i)*.1*t,.65+t*.95,Math.cos(t*4+i)*.08*t);
   child.scale.setScalar(.045+t*.18);
   ((child as T.Mesh).material as T.MeshBasicMaterial).opacity=Math.sin(t*Math.PI)*.24;
  });
  state.invalidate();
 });
 return <group visible={reveal>0} position={[13.85,.85,-190.48]} rotation={[0,Math.PI,0]}>
  <mesh position={[0,.13,0]}><sphereGeometry args={[.14,12,8]}/><meshStandardMaterial transparent={reveal<1} opacity={reveal} depthWrite={reveal>=1} color="#23676b" metalness={.25} roughness={.25}/></mesh>
  <mesh position={[0,.34,0]}><cylinderGeometry args={[.025,.04,.37,12]}/><meshStandardMaterial transparent={reveal<1} opacity={reveal} depthWrite={reveal>=1} color="#b9b9ac" metalness={.8} roughness={.25}/></mesh>
  <mesh position={[0,.51,0]}><cylinderGeometry args={[.13,.13,.025,16]}/><meshStandardMaterial transparent={reveal<1} opacity={reveal} depthWrite={reveal>=1} color="#9d9c8e" metalness={.8} roughness={.3}/></mesh>
  <mesh position={[0,.57,0]}><cylinderGeometry args={[.075,.04,.1,12]}/><meshStandardMaterial transparent={reveal<1} opacity={reveal} depthWrite={reveal>=1} color="#946b4c" roughness={.85}/></mesh>
  {[-1,1].map(i=><mesh key={i} position={[i*.027,.63,0]}><boxGeometry args={[.035,.025,.035]}/><meshStandardMaterial transparent={reveal<1} opacity={reveal} depthWrite={reveal>=1} color="#332824" emissive="#d94c14" emissiveIntensity={.65}/></mesh>)}
  <mesh><tubeGeometry args={[hose,24,.016,6,false]}/><meshStandardMaterial transparent={reveal<1} opacity={reveal} depthWrite={reveal>=1} color="#282a30" roughness={.7}/></mesh>
  <group ref={smoke} visible={active}>{Array.from({length:9},(_,i)=><mesh key={i}><sphereGeometry args={[1,8,6]}/><meshBasicMaterial color="#dce5e4" transparent opacity={0} depthWrite={false}/></mesh>)}</group>
 </group>;
}
