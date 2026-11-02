"use client";
import {memo,useMemo,useLayoutEffect,useRef} from 'react';
import * as THREE from 'three';
import {BoxBatch} from '@/components/scene/SceneryBatches';
type B={x:number,y:number,z:number,sx:number,sy:number,sz:number};
function buildHomes(extension:number,blocked=false){
 const clear=(x:number,z:number,w:number,d:number)=>!(x+w/2> -12&&z+d/2> -306-extension&&z-d/2< -214-extension);
const walls:B[]=[],cream:B[]=[],glass:B[]=[],trim:B[]=[];
for(let i=0;i<64;i++){
 const z=80-i*39,x=(i%2?1:-1)*(42+i%4*9),h=[9,24,36,15,30][i%5],w=12+i%3*3,d=10;
 if(clear(x,z,w+2,d+3)===blocked)continue;
 (i%2?walls:cream).push({x,y:h/2,z,sx:w,sy:h,sz:d});
 trim.push({x,y:h+.2,z,sx:w+.6,sy:.4,sz:d+.6},{x,y:1,z,sx:w+.3,sy:2,sz:d+.3});
 for(let floor=0;floor<Math.floor(h/3);floor++)for(let col=0;col<4;col++)for(const side of [-1,1])glass.push({x:x+(col-1.5)*w/4,y:2+floor*3,z:z+side*(d/2+.02),sx:1.5,sy:1.8,sz:.06});
 for(const side of [-1,1])for(let floor=0;floor<Math.floor(h/3);floor++)for(let col=0;col<3;col++)glass.push({x:x+side*(w/2+.02),y:2+floor*3,z:z+(col-1)*2.7,sx:.06,sy:1.8,sz:1.5});
 if(i%3===0)for(let k=0;k<3;k++)trim.push({x:x+(k-1)*w/3,y:h/2,z:z+d/2+.12,sx:.25,sy:h,sz:.25});
}
const historicWalls:B[]=[],ornament:B[]=[],windows:B[]=[],iron:B[]=[];
const historic=Array.from({length:22},(_,i)=>({x:(i%2?1:-1)*29,z:15-i*105,h:10+(i%3)*3,w:10+(i%2)*2})).filter(b=>clear(b.x,b.z,b.w+2,12)!==blocked);
for(const {x,z,h,w} of historic){
 historicWalls.push({x,y:h/2,z,sx:w,sy:h,sz:9});
 for(const y of [.7,h-.35,h+.05])ornament.push({x,y,z,sx:w+.7,sy:.25,sz:9.6});
 for(const side of [-1,1]){
 const face=z+side*4.55;
 for(let f=0;f<Math.floor(h/3);f++)for(let c=0;c<3;c++){
 const wx=x+(c-1)*2.9,wy=1.9+f*3;
 windows.push({x:wx,y:wy,z:face,sx:1.35,sy:1.9,sz:.1});
 for(const off of [-.8,.8])ornament.push({x:wx+off,y:wy,z:face+side*.1,sx:.18,sy:2.2,sz:.22});
 for(const off of [-1.1,1.1])ornament.push({x:wx,y:wy+off,z:face+side*.1,sx:1.9,sy:.18,sz:.4});
 if(f===1){ornament.push({x:wx,y:wy-1,z:face+side*.5,sx:2,sy:.18,sz:1});for(let k=0;k<7;k++)iron.push({x:wx+(k-3)*.28,y:wy-.55,z:face+side*.95,sx:.045,sy:.8,sz:.045});iron.push({x:wx,y:wy-.15,z:face+side*.95,sx:2,sy:.06,sz:.06});}
 }
 for(const off of [-w/2+.25,w/2-.25])ornament.push({x:x+off,y:h/2,z:face,sx:.5,sy:h,sz:.3});
 }
}
return {walls,cream,glass,trim,historicWalls,ornament,windows,iron,historic};
}
const HomesBatch=memo(function HomesBatch({extension,blocked=false,opacity=1}:{extension:number,blocked?:boolean,opacity?:number}){
 const root=useRef<THREE.Group>(null);
 useLayoutEffect(()=>{root.current?.traverse(object=>{
  if(!(object instanceof THREE.Mesh))return;
  for(const material of (Array.isArray(object.material)?object.material:[object.material])){
   material.transparent=blocked;material.opacity=opacity;material.depthWrite=opacity>.99;
  }
 });},[blocked,opacity,extension]);
 const {walls,cream,glass,trim,historicWalls,ornament,windows,iron,historic}=useMemo(()=>buildHomes(extension,blocked),[extension,blocked]);
 return <group ref={root} visible={opacity>0}><BoxBatch items={historicWalls} color="#c8a58e"/><BoxBatch items={ornament} color="#f1dfbc"/><BoxBatch items={windows} color="#344b57"/><BoxBatch items={iron} color="#35404a"/>{historic.map((b,i)=><group key={i} position={[b.x,b.h,b.z]}><group position={[0,1.7,0]} scale={[(b.w+.9)/2,1,9.9/2]}><mesh rotation={[0,Math.PI/4,0]}><coneGeometry args={[Math.SQRT2,3.2,4]}/><meshStandardMaterial color={i%2?"#58636c":"#88564b"} roughness={.9}/></mesh></group><mesh position={[b.w*.28,2,1]}><boxGeometry args={[.65,2.4,.7]}/><meshStandardMaterial color="#9c7763"/></mesh></group>)}<BoxBatch items={walls} color="#b1c1ca"/><BoxBatch items={cream} color="#d8c9b5"/><BoxBatch items={glass} color="#3d5362"/><BoxBatch items={trim} color="#eee8de"/></group>});

export default memo(function HighwayHomes({extension,progress}:{extension:number,progress:number}){
 const t=Math.max(0,Math.min(1,(progress-.46)/.07));
 const opacity=1-t*t*(3-2*t);
 return <><HomesBatch extension={extension}/><HomesBatch extension={extension} blocked opacity={opacity}/></>;
});
