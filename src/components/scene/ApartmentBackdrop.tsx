"use client";
import { memo,useMemo,useEffect } from 'react';
import * as THREE from 'three';

export default memo(function ApartmentBackdrop(){
  const {texture,walls,roof}=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
    const c=canvas.getContext('2d')!;
    c.fillStyle='#b5bab9';c.fillRect(0,0,256,512);
    for(let row=0;row<16;row++)for(let col=0;col<8;col++){
      const x=col*32,y=row*32;
      c.fillStyle='#d9dcd6';c.fillRect(x+6,y+5,21,23);
      c.fillStyle=(row*13+col*7)%11===0?'#c4af83':'#435664';c.fillRect(x+8,y+7,17,19);
      c.fillStyle='#a4b0b3';c.fillRect(x+16,y+7,1,19);
      c.fillStyle='#8b9290';c.fillRect(x,y+31,32,1);
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const walls=['#eee7d8','#b0c4cc','#d9b499','#e4e6df'].map(color=>new THREE.MeshStandardMaterial({map:texture,color,roughness:.95}));
    const roof=new THREE.MeshStandardMaterial({color:'#7c8587',roughness:1});
    return {texture,walls,roof};
  },[]);
  useEffect(()=>()=>{texture.dispose();walls.forEach(m=>m.dispose());roof.dispose();},[texture,walls,roof]);
  return <group>
    {Array.from({length:12},(_,i)=>{
      // Road is z=-283, width 10m: even the closest podium is >25m away.
      const type=i%4,height=[24,43,34,53][type],width=[26,17,22,16][type],depth=[14,17,15,18][type];
      const x=65+(i%4)*37,z=-325-Math.floor(i/4)*66-(i%2)*12;
      const facade=[walls[type],walls[type],roof,roof,walls[type],walls[type]];
      return <group key={i} position={[x,0,z]}>
        <mesh position={[0,height/2,0]} material={facade}><boxGeometry args={[width,height,depth]} /></mesh>
        <mesh position={[0,height+.22,0]} material={roof}><boxGeometry args={[width+.5,.44,depth+.5]} /></mesh>
        <mesh position={[0,1.8,0]}><boxGeometry args={[width+1,3.6,depth+1]} /><meshStandardMaterial color={i%2?'#777e82':'#8a8176'} roughness={1} /></mesh>
        <mesh position={[0,height+1.2,0]} material={roof}><boxGeometry args={[5,2,4]} /></mesh>
        {type===0&&<mesh position={[width*.6,height*.35,-2]} material={facade}><boxGeometry args={[width*.4,height*.7,depth*.8]}/></mesh>}
        {[0,1,2].map(j=><mesh key={j} position={[(j-1)*width*.28,height*.5,depth*.5+.3]}><boxGeometry args={[1.15,height-.8,.6]}/><meshStandardMaterial color={type===1?'#815a48':'#d2d2c7'} roughness={1}/></mesh>)}
      </group>;
    })}
  </group>;
});
