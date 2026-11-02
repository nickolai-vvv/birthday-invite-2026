"use client";
import {useRef,useLayoutEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {racePose,type Race} from '@/lib/scene/race';
export default function TireMarks({race,progress}:{race:Race,progress:number}){
 const mesh=useRef<T.InstancedMesh>(null),state=useRef({last:null as T.Vector3|null,armed:false,remaining:0,braking:false,cursor:0,count:0,transform:new T.Object3D()});
 useLayoutEffect(()=>{if(mesh.current)mesh.current.count=0;},[]);
 useFrame((_,delta)=>{
  if(!mesh.current)return;
  const s=state.current,pose=racePose(race,progress);
  const point=new T.Vector3(pose.x,0,pose.z+1.35);
  const braking=race.braking&&race.acceleration< -9;
  if(race.mode!=='SHASHKI'){s.armed=false;s.remaining=0;s.braking=false;s.last=null;return;}
  if(race.speed*3.6>=199.5)s.armed=true;
  if(braking&&!s.braking){s.remaining=s.armed?.58:0;s.armed=false;}
  if(!braking&&race.speed*3.6<199.5)s.armed=false;
  s.braking=braking;
  const active=braking&&s.remaining>0;s.remaining=Math.max(0,s.remaining-delta);
  if(!active){s.last=null;return;}
  if(!s.last){s.last=point;return;}
  const length=point.distanceTo(s.last);if(length<.12)return;if(length>5){s.last=point;return;}
  const mid=point.clone().add(s.last).multiplyScalar(.5),angle=Math.atan2(point.x-s.last.x,point.z-s.last.z);
  for(const side of [-1,1]){s.transform.position.set(mid.x+side*.78*Math.cos(pose.yaw),.023,mid.z-side*.78*Math.sin(pose.yaw));s.transform.rotation.set(-Math.PI/2,0,angle);s.transform.scale.set(.19,length+.035,1);s.transform.updateMatrix();mesh.current.setMatrixAt(s.cursor,s.transform.matrix);s.cursor=(s.cursor+1)%800;s.count=Math.min(800,s.count+1);}
  mesh.current.count=s.count;mesh.current.instanceMatrix.needsUpdate=true;s.last=point;
 });
 return <instancedMesh ref={mesh} args={[undefined,undefined,800]} frustumCulled={false}><planeGeometry/><meshBasicMaterial color="#242525" transparent opacity={.35} depthWrite={false} polygonOffset polygonOffsetFactor={-1}/></instancedMesh>;
}
