"use client";
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

let assets:ReturnType<typeof makeAssets>|undefined;
function makeAssets(){
  const bottle=mergeGeometries([new T.BoxGeometry(.078,.18,.078).translate(0,.09,0),new T.BoxGeometry(.062,.025,.062).translate(0,.1925,0),new T.BoxGeometry(.044,.022,.044).translate(0,.216,0),new T.BoxGeometry(.028,.092,.028).translate(0,.273,0)]);
  const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=256;const c=labelCanvas.getContext('2d')!;
  for(const x of [128]){
    c.fillStyle='#eee9db';c.beginPath();c.ellipse(x,128,91,116,0,0,Math.PI*2);c.fill();
    c.fillStyle='#163652';c.textAlign='center';c.font='bold 42px Georgia';c.fillText('Corona',x,134);c.font='22px Georgia';c.fillText('Extra',x,164);c.font='12px Arial';c.fillText('CERVEZA · 355 ml',x,203);
    c.strokeStyle='#a98b35';c.lineWidth=5;c.beginPath();c.moveTo(x-25,73);c.lineTo(x-30,45);c.lineTo(x-12,57);c.lineTo(x,33);c.lineTo(x+12,57);c.lineTo(x+30,45);c.lineTo(x+25,73);c.closePath();c.stroke();
  }
  const labelTex=new T.CanvasTexture(labelCanvas);labelTex.colorSpace=T.SRGBColorSpace;labelTex.magFilter=T.NearestFilter;labelTex.minFilter=T.NearestFilter;
  const carton=document.createElement('canvas');carton.width=512;carton.height=256;const b=carton.getContext('2d')!;b.fillStyle='#dbc791';b.fillRect(0,0,512,256);b.fillStyle='#1d3546';b.textAlign='center';b.font='bold 70px Georgia';b.fillText('Corona',256,126);b.font='32px Georgia';b.fillText('Extra',256,169);b.font='18px Arial';b.fillText('12 × 355 ml',256,220);
  const cartonTex=new T.CanvasTexture(carton);cartonTex.colorSpace=T.SRGBColorSpace;
  return {bottle,label:new T.BoxGeometry(.079,.12,.079),cap:new T.BoxGeometry(.03,.012,.03),glass:new T.MeshStandardMaterial({color:'#deb968',metalness:.05,roughness:.23,envMapIntensity:.9}),labelMaterial:new T.MeshStandardMaterial({map:labelTex,alphaTest:.5,roughness:.65}),capMaterial:new T.MeshStandardMaterial({color:'#d1bf79',metalness:.65,roughness:.3}),cardboard:new T.MeshStandardMaterial({map:cartonTex,roughness:.9})};
}
function getAssets(){return assets??(assets=makeAssets());}
export function Bottle({scale=1}:{scale?:number}){const a=getAssets();return <group scale={scale} dispose={null}><mesh geometry={a.bottle} material={a.glass} /><mesh position={[0,.095,0]} geometry={a.label} material={a.labelMaterial} /><mesh position={[0,.325,0]} geometry={a.cap} material={a.capMaterial} /></group>;}
export function Crate(){const a=getAssets();return <group scale={1.25} dispose={null}>
  <mesh material={a.cardboard}><boxGeometry args={[.48,.22,.34]} /></mesh>
  {[-1,1].map(side=><mesh key={side} position={[side*.241,.045,0]}><boxGeometry args={[.002,.035,.105]} /><meshStandardMaterial color="#75623e" /></mesh>)}
  {[0,1,2,3].map(x=>[0,1,2].map(z=><group key={`${x}-${z}`} position={[(x-1.5)*.103,.015,(z-1)*.097]}><Bottle /></group>))}
 </group>;}
