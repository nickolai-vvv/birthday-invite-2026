"use client";
import Guest from '@/components/scene/Guest';
import Hookah from '@/components/scene/Hookah';
import { Crate } from '@/components/scene/PartyProps';
import { guestPose,driverPose,cratePose,ease } from '@/lib/scene/party-motion';
export default function PartyScene({p}:{p:number}){
  const driver=driverPose(p),crate=cratePose(p),toast=ease(p,.994,1);
  return <>
    <Hookah active={p>=.994} reveal={ease(p,.985,.994)} />
    {[0,1,2,3,4,5].map(i=>{const pose=guestPose(p,i);return <group key={i} visible={pose.visible}><Guest {...pose} index={i} gray={p>=.915+i*.01+.003} toast={toast} dance={pose.arrived?1-ease(p,.990,.994):0} /></group>;})}
    <group visible={driver.visible}><Guest {...driver} index={6} toast={toast} /></group>
    {<group visible={driver.visible} position={[crate.x,crate.y,crate.z]} rotation={[0,crate.angle,0]}><Crate /></group>}
  </>;
}
