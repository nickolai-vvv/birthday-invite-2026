"use client";
import {useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useTexture} from '@react-three/drei';
import * as T from 'three';
import {guests} from '@/data/guests';
import {Bottle} from '@/components/scene/PartyProps';
// Minecraft 64x64 skin layout, as used in mertdogan12/steve.ts.
function part(w:number,h:number,d:number,x:number,y:number){const g=new T.BoxGeometry(w,h,d);const rects=[[x+w,y,d,h],[x-d,y,d,h],[x,y-d,w,d],[x+w,y-d,w,d],[x,y,w,h],[x+w+d,y,w,h]];(g.attributes.uv as T.BufferAttribute).set(rects.flatMap(([u,v,a,b])=>[u/64,1-v/64,(u+a)/64,1-v/64,u/64,1-(v+b)/64,(u+a)/64,1-(v+b)/64]));return g;}
export default function Guest({x,z,angle,walk,carry=false,carryWeight=carry?1:0,place=0,toast=0,index=0,dance=0}:{x:number,z:number,angle:number,walk:number,emerge?:number,carry?:boolean,carryWeight?:number,place?:number,toast?:number,index?:number,dance?:number}){
 const texture=useTexture(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/models/steve-classic.png`);texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.colorSpace=T.SRGBColorSpace;
 const a=useMemo(()=>({head:part(8,8,8,8,8),body:part(8,12,4,20,20),arm:part(4,12,4,44,20),leg:part(4,12,4,4,20),mat:new T.MeshStandardMaterial({map:texture,roughness:.9})}),[texture]);
 const body=useRef<T.Group>(null),arms=useRef<(T.Group|null)[]>([]),legs=useRef<(T.Group|null)[]>([]),motion=useRef({weight:0,time:0});
 const invalidate=useThree(s=>s.invalidate);
 const swing=walk>0?Math.sin(walk*6)*.55:0,scale=1.8/32;
 useFrame((_,delta)=>{
  const m=motion.current;m.time+=Math.min(delta,.05);m.weight+=(dance-m.weight)*(1-Math.exp(-Math.min(delta,.05)*7));
  const style=index%6,t=m.time*[2.8,4.4,3.2,2.4,4.8,3.7][style]+index*.9,w=m.weight;
  const sway=Math.sin(t),beat=Math.sin(t*2);
  const lift=style===4?Math.abs(beat)*.065:style===1?Math.abs(sway)*.045:Math.abs(sway)*.018;
  const twist=style===2?sway*.22:style===5?Math.sin(t*.5)*.16:sway*.06;
  if(body.current){body.current.position.y=lift*w;body.current.position.x=(style===3?sway*.065:0)*w;body.current.rotation.z=sway*(style===0?.07:.025)*w;body.current.rotation.y=twist*w;}
  for(let i=0;i<2;i++){const side=i===0?-1:1;
   const base=T.MathUtils.lerp(side===-1?T.MathUtils.lerp(-side*swing,-1.8,toast):-side*swing,-1.25-place*.25,carryWeight);
   const armX=style===0?-.35+side*sway*.2:style===1?-1.1+side*beat*.4:style===2?-.5+side*sway*.45:style===3?-.2+Math.sin(t+side)*.18:style===4?-.85+beat*.5:side===-1?-1.5+sway*.25:-.3+beat*.2;
   const armZ=side*(style===2?.35:style===5?.28:.15)+sway*(style===0?.15:.06);
   if(arms.current[i]){arms.current[i]!.rotation.x=T.MathUtils.lerp(base,armX,w);arms.current[i]!.rotation.z=armZ*w;}
   if(legs.current[i])legs.current[i]!.rotation.x=T.MathUtils.lerp(side*swing,side*(style===3?Math.sin(t)*.26:style===4?beat*.18:style===1?sway*.23:sway*.09),w);
  }
  if(dance>0||w>.001)invalidate();
 });
 return <group position={[x,0,z]} rotation={[0,angle,0]}>
 <group ref={body}><group scale={scale}>
 <mesh geometry={a.body} material={a.mat} position={[0,18,0]}/><mesh geometry={a.head} material={a.mat} position={[0,28,0]}/><mesh position={[0,31.2,0]}><boxGeometry args={[8.12,1.7,8.12]}/><meshStandardMaterial color={guests[index].hair}/></mesh><mesh position={[0,29,-3.95]}><boxGeometry args={[8.1,3,.2]}/><meshStandardMaterial color={guests[index].hair}/></mesh>
 {[-1,1].map(side=><group key={side}>
 <group ref={o=>{legs.current[side===-1?0:1]=o;}} position={[side*2,12,0]} rotation={[side*swing,0,0]}><mesh position={[0,-6,0]} geometry={a.leg} material={a.mat}/></group>
 <group ref={o=>{arms.current[side===-1?0:1]=o;}} position={[side*6,24,0]} rotation={[T.MathUtils.lerp(side===-1?T.MathUtils.lerp(-side*swing,-1.8,toast):-side*swing,-1.25-place*.25,carryWeight),0,0]}><mesh position={[0,-6,0]} geometry={a.arm} material={a.mat}/>{side===-1&&toast>0&&<group position={[0,-10,0]} rotation={[Math.PI/2,0,0]} scale={1/scale}><Bottle scale={1.65}/></group>}</group>
 </group>)}
 </group>

 </group></group>;
}


