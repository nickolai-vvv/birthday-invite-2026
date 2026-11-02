"use client";
import { memo, useLayoutEffect, useRef } from 'react';
import * as T from 'three';
type Instance={x:number,y:number,z:number,sx:number,sy:number,sz:number,ry?:number,color?:string};
export const BoxBatch=memo(function BoxBatch({items,color}:{items:Instance[],color:string}){
  const ref=useRef<T.InstancedMesh>(null);
  useLayoutEffect(()=>{const o=new T.Object3D();items.forEach((v,i)=>{o.position.set(v.x,v.y,v.z);o.scale.set(v.sx,v.sy,v.sz);o.rotation.y=v.ry??0;o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);});ref.current!.instanceMatrix.needsUpdate=true;ref.current!.computeBoundingSphere();},[items]);
  return <instancedMesh ref={ref} args={[undefined,undefined,items.length]}><boxGeometry /><meshStandardMaterial color={color} roughness={.95}/></instancedMesh>;
});
export const highwayLines:Instance[]=Array.from({length:46},(_,i)=>({x:0,y:.015,z:37-i*6,sx:.075,sy:.018,sz:2.6}));
export const turnLines:Instance[]=[];
for(const radius of [40.4,49.6])for(let i=0;i<80;i++){const a=(i+.5)/80*Math.PI/2;turnLines.push({x:45-radius*Math.cos(a),y:.014,z:-238-radius*Math.sin(a),sx:.075,sy:.012,sz:radius*Math.PI/160+.03,ry:-a});}
for(let i=0;i<12;i++){const a=(i+.5)/12*Math.PI/2;turnLines.push({x:45-45*Math.cos(a),y:.015,z:-238-45*Math.sin(a),sx:.075,sy:.012,sz:2.6,ry:-a});}
for(let i=0;i<50;i++)turnLines.push({x:48+i*6,y:.015,z:-283,sx:2.6,sy:.012,sz:.075});
export const DirtDetails=memo(function DirtDetails({zone}:{zone:number}){
  const ref=useRef<T.InstancedMesh>(null);
  useLayoutEffect(()=>{const o=new T.Object3D(),color=new T.Color();let count=0;
    for(let i=0;i<220;i++){
      const z=-251-i*1.75;if(z>zone+40||z<zone-290)continue;
      o.position.set(1.5+Math.sin(i*7.3)*6,.003,z);o.rotation.set(-Math.PI/2,0,i);o.scale.setScalar(.15+(i%4)*.08);o.updateMatrix();
      ref.current!.setMatrixAt(count,o.matrix);ref.current!.setColorAt(count,color.set(i%2?'#7e735f':'#afa080'));count++;
    }
    ref.current!.count=count;ref.current!.instanceMatrix.needsUpdate=true;if(ref.current!.instanceColor)ref.current!.instanceColor.needsUpdate=true;ref.current!.computeBoundingSphere();
  },[zone]);
  return <instancedMesh ref={ref} args={[undefined,undefined,220]}><circleGeometry args={[1,9]}/><meshStandardMaterial roughness={1}/></instancedMesh>;
});
