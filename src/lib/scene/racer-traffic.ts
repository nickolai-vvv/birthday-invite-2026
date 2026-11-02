import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// Original low-poly 3D traffic: compact, coupe and panel van.
export function createRacerTraffic(type:number){
 const root=new T.Group(),parts=new Map<T.Material,T.BufferGeometry[]>();
 const paint=new T.MeshStandardMaterial({color:['#d5ba68','#ae4039','#c8d5db'][type],roughness:.38,metalness:.35});
 const glass=new T.MeshStandardMaterial({color:'#233e50',roughness:.2,metalness:.45});
 const dark=new T.MeshStandardMaterial({color:'#252a2f',roughness:.9});
 const chrome=new T.MeshStandardMaterial({color:'#aab4bd',metalness:.75,roughness:.28});
 const lights=new T.MeshStandardMaterial({color:'#fff0c7',emissive:'#fff0c7',emissiveIntensity:.25});
 const rear=new T.MeshStandardMaterial({color:'#a92322',emissive:'#8a1919',emissiveIntensity:.3});
 const van=type===2,coupe=type===1,L=van?5.1:coupe?4.6:4.05,W=van?1.94:1.8;
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material){const g=m===paint?new RoundedBoxGeometry(w,h,d,2,Math.min(.09,h*.25,w*.2,d*.2)):new T.BoxGeometry(w,h,d);g.translate(x,y,z);const list=parts.get(m)??[];list.push(g);parts.set(m,list);}
 // Side silhouette with genuine open wheel arches, extruded across the body.
 const outline=new T.Shape(),axle=L*.31,arch=.4;
 outline.moveTo(-L/2,.42);
 for(const a of [-axle,axle]){outline.lineTo(a-arch,.42);outline.absarc(a,.42,arch,Math.PI,0,true);}
 outline.lineTo(L/2,.42);outline.lineTo(L/2,.84);outline.lineTo(L*.39,1.04);outline.lineTo(-L*.36,1.04);outline.lineTo(-L/2,.82);outline.closePath();
 const shell=new T.ExtrudeGeometry(outline,{depth:W-.08,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.04,bevelThickness:.04,curveSegments:10});shell.rotateY(-Math.PI/2);shell.translate((W-.08)/2,0,0);parts.set(paint,[shell]);
 box(W*.87,.08,L*.24,0,1.04,-L*.34,paint);
 for(const x of [-W*.49,W*.49]){box(.06,.1,L*.48,x,.51,0,dark);box(.025,.025,L*.5,x,1.01,0,chrome);}

 if(van){box(W*.96,1.3,L*.56,0,1.56,.9,paint);box(W*.88,.85,1.4,0,1.45,-1.2,glass);box(W,.12,1.5,0,1.92,-1.2,paint);box(.07,.9,1.42,-W*.43,1.45,-1.2,paint);box(.07,.9,1.42,W*.43,1.45,-1.2,paint);}
 else{
 const top=coupe?1.48:1.65,front=coupe?-.7:-.75,back=coupe?.65:.85;
 // Tapered cabin: roof is narrower than the beltline, no glass extrusion through pillars.
 const vertices=[-W*.44,1.02,-1.3,W*.44,1.02,-1.3,W*.44,1.02,1.35,-W*.44,1.02,1.35,-W*.35,top,front,W*.35,top,front,W*.35,top,back,-W*.35,top,back];
 const cabin=new T.BufferGeometry();cabin.setAttribute('position',new T.Float32BufferAttribute(vertices,3));cabin.setIndex([0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0]);cabin.computeVertexNormals();cabin.setAttribute('uv',new T.Float32BufferAttribute(new Array(16).fill(0),2));parts.set(glass,[cabin]);
 box(W*.72,.075,back-front+.08,0,top+.015,(back+front)/2,paint);
 function pillar(ax:number,ay:number,az:number,bx:number,by:number,bz:number){const a=new T.Vector3(ax,ay,az),b=new T.Vector3(bx,by,bz),direction=b.clone().sub(a);const g=new T.BoxGeometry(.065,direction.length(),.065);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());parts.get(paint)!.push(g);}
 for(const side of [-1,1]){
 pillar(side*W*.44,1.02,-1.3,side*W*.35,top,front);
 pillar(side*W*.44,1.02,1.35,side*W*.35,top,back);
 pillar(side*W*.44,1.02,.15,side*W*.35,top,.15);
 }
 if(coupe){box(W,.08,.35,0,1.27,L*.39,paint);for(const x of [-.6,.6])box(.08,.25,.08,x,1.13,L*.39,dark);}
 }
 for(const side of [-1,1]){box(.23,.14,.35,side*(W/2+.08),1.18,-.8,paint);box(.22,.055,.06,side*W/2,1.04,.4,chrome);box(W,.14,.15,0,.48,side*L/2,dark);for(const x of [-W*.33,W*.33])box(.44,.2,.07,x,.85,side*(L/2+.01),side<0?lights:rear);}
 box(W*.36,.18,.08,0,.67,-L/2-.02,dark);
 // Grille slats, fog lamps, rear plate and split taillights.
 for(let j=0;j<4;j++)box(W*.34,.025,.035,0,.60+j*.06,-L/2-.065,chrome);
 for(const x of [-W*.37,W*.37]){box(.22,.09,.05,x,.55,-L/2-.06,lights);box(.4,.035,.075,x,.85,L/2+.04,chrome);}
 box(.43,.16,.045,0,.76,L/2+.055,chrome);
 for(const side of [-1,1])for(const z of (coupe?[.48]:[-.48,.65])){box(.025,.38,.018,side*W*.505,.8,z,dark);box(.025,.05,.19,side*W*.51,1,z-.12,chrome);}
 for(const [mat,geos] of parts){
  // Extruded / rounded surfaces are non-indexed; boxes use indices.
  const compatible=geos.map(g=>g.index?g.toNonIndexed():g);
  const merged=mergeGeometries(compatible);
  for(const g of new Set([...geos,...compatible]))g.dispose();
  if(!merged)throw new Error(`Unable to merge traffic body type ${type}`);
  root.add(new T.Mesh(merged,mat));
 }
 for(const x of [-W/2,W/2])for(const z of [-L*.31,L*.31]){
 const wheel=new T.Group();wheel.name='traffic-wheel';wheel.position.set(x*.94,.34,z);
 const tire=new T.Mesh(new T.CylinderGeometry(.34,.34,.23,20),dark);tire.rotation.z=Math.PI/2;wheel.add(tire);
 const rim=new T.Mesh(new T.CylinderGeometry(.22,.22,.245,16),chrome);rim.rotation.z=Math.PI/2;wheel.add(rim);
 for(let i=0;i<5;i++){const spoke=new T.Mesh(new T.BoxGeometry(.25,.045,.36),dark);spoke.rotation.x=i*Math.PI/5;wheel.add(spoke);}
 root.add(wheel);
 }
 return root;
}
