"use client";
import {memo} from 'react';
import WorkshopTools from '@/components/scene/WorkshopTools';
function Box({p,s,c='#596365'}:{p:[number,number,number],s:[number,number,number],c?:string}){return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.75} metalness={.35}/></mesh>}
export default memo(function GarageWorkshop(){return <group>
  {/* Back-wall shelving, kept clear of the guests and table. */}
  {[-1.65,1.65].map(x=><Box key={x} p={[x,1.15,-7.65]} s={[.06,2.3,.5]}/>)}
  {[.35,1,1.65,2.25].map(y=><Box key={y} p={[0,y,-7.65]} s={[3.35,.055,.55]} c="#776b55"/>)}
  {Array.from({length:9},(_,i)=><Box key={i} p={[-1.4+(i%5)*.6,i<5?.55:1.22,-7.65]} s={[.4,i%2?.33:.25,.35]} c={['#6c7564','#8c5440','#626d76'][i%3]}/>)}
  <Box p={[-1.15,.28,-6.85]} s={[.85,.5,.55]} c="#444b4a"/>
  <Box p={[-1.15,.61,-6.85]} s={[.88,.16,.59]} c="#8b9390"/>
  {[0,1,2,3].map(i=><group key={i} position={[-1.45+i*.2,.7,-6.85]}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.07,.08,.69,12]}/><meshStandardMaterial color="#9da6a1" metalness={.65} roughness={.4}/></mesh><Box p={[0,.08,0]} s={[.1,.07,.2]} c="#3e4847"/></group>)}
  <group position={[.1,.46,-7.25]} rotation={[0,0,Math.PI/2]}>
    <mesh><cylinderGeometry args={[.045,.045,1.1,12]}/><meshStandardMaterial color="#919995" metalness={.8} roughness={.3}/></mesh>
    {[-.4,-.13,.13,.4].map((y,i)=><group key={y} position={[0,y,0]} rotation={[0,i*Math.PI/2,0]}><Box p={[.06,0,0]} s={[.18,.055,.16]} c="#687270"/><mesh position={[.13,.06,0]}><cylinderGeometry args={[.045,.045,.12,12]}/><meshStandardMaterial color="#abb1a9" metalness={.8} roughness={.3}/></mesh></group>)}
  </group>
  <WorkshopTools />
 </group>});
