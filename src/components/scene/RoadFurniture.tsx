"use client";
import {memo,useMemo} from 'react';
import {BoxBatch} from '@/components/scene/SceneryBatches';
type Box={x:number,y:number,z:number,sx:number,sy:number,sz:number};
export default memo(function RoadFurniture({extension,hideLeft=false}:{extension:number,hideLeft?:boolean}){
 const batches=useMemo(()=>{
  const walk:Box[]=[],curb:Box[]=[],metal:Box[]=[],lamp:Box[]=[];
  const end=-220-extension,length=40-end,center=(40+end)/2;
  for(const side of [-1,1]){
   walk.push({x:side*7,y:.07,z:center,sx:2.8,sy:.14,sz:length});
   curb.push({x:side*5.55,y:.12,z:center,sx:.25,sy:.24,sz:length});
   for(let z=30;z>end+8;z-=32){
    const x=side*8.1;
    metal.push({x,y:3.7,z,sx:.12,sy:7.4,sz:.12},{x:x-side*.9,y:7.35,z,sx:1.9,sy:.12,sz:.12},{x,y:.25,z,sx:.3,sy:.5,sz:.3});
    lamp.push({x:x-side*1.7,y:7.27,z,sx:.65,sy:.12,sz:.32});
   }
  }
  return {walk,curb,metal:metal.filter(b=>b.x>0),lamp:lamp.filter(b=>b.x>0),leftMetal:metal.filter(b=>b.x<0),leftLamp:lamp.filter(b=>b.x<0)};
 },[extension]);
 return <><BoxBatch items={batches.walk} color="#a8a6a0"/><BoxBatch items={batches.curb} color="#d2cfc6"/><group visible={!hideLeft}><BoxBatch items={batches.leftMetal} color="#515e65"/><BoxBatch items={batches.leftLamp} color="#f3e3b5"/></group><BoxBatch items={batches.metal} color="#515e65"/><BoxBatch items={batches.lamp} color="#f3e3b5"/></>;
});
