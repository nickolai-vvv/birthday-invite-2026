"use client";
import {memo,useMemo} from 'react';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// All stationary tools are merged by material: detail adds geometry, not hundreds of draw calls.
function makePanel(variant:number){
 const group=new T.Group(),buckets=new Map<T.Material,T.BufferGeometry[]>();
 const steel=new T.MeshStandardMaterial({color:'#a5b2b4',metalness:.78,roughness:.3});
 const dark=new T.MeshStandardMaterial({color:'#354045',metalness:.4,roughness:.65});
 const red=new T.MeshStandardMaterial({color:variant?'#b47d35':'#9b4939',roughness:.8});
 const board=new T.MeshStandardMaterial({color:variant?'#5a6260':'#655c4d',roughness:.95});
 const o=new T.Object3D();
 function add(g:T.BufferGeometry,m:T.Material,x:number,y:number,z=.065,rz=0){o.position.set(x,y,z);o.rotation.set(0,0,rz);o.updateMatrix();let geometry=g.index?g.toNonIndexed():g;geometry.applyMatrix4(o.matrix);geometry.deleteAttribute('uv');if(!buckets.has(m))buckets.set(m,[]);buckets.get(m)!.push(geometry);}
 function box(x:number,y:number,w:number,h:number,m=steel,z=.065,d=.028,rz=0){add(new T.BoxGeometry(w,h,d),m,x,y,z,rz);}
 function ring(x:number,y:number,r:number,m=steel,arc=Math.PI*2,rot=0){add(new T.TorusGeometry(r,.012,6,16,arc),m,x,y,.085,rot);}
 function wrench(x:number,y:number,length:number){box(x,y,.038,length);ring(x,y+length/2,.046);ring(x,y-length/2,.049,steel,Math.PI*1.35,Math.PI*.32);box(x,y,.018,length*.63,dark,.082,.003);}
 function screwdriver(x:number,y:number,length:number){box(x,y-.07,.013,length*.65);box(x,y+.09,.055,.16,red,.09,.05);box(x,y+.09,.023,.12,dark,.117,.005);box(x,y-length*.4,.03,.05,steel);}
 function pliers(x:number,y:number){box(x-.045,y-.08,.045,.2,red,.08,.04,-.26);box(x+.045,y-.08,.045,.2,red,.08,.04,.26);box(x-.025,y+.07,.028,.14,steel,.08,.025,-.22);box(x+.025,y+.07,.028,.14,steel,.08,.025,.22);ring(x,y,.027);}
 box(0,0,3.0,1.35,board,0,.045);
 for(let x=-1.4;x<1.5;x+=.15)for(let y=-.57;y<.6;y+=.15)add(new T.CircleGeometry(.007,5),dark,x,y,.025);
 for(let i=0;i<6;i++){wrench(-1.25+i*.18,.21,.24+i*.035);box(-1.25+i*.18,.42,.014,.04,dark,.085,.08);}
 for(let i=0;i<5;i++)screwdriver(.05+i*.16,.17,.32+i*.025);
 pliers(.98,.18);pliers(1.27,.18);
 // Socket rail, ratchet and a hammer beneath the main rows.
 box(-.79,-.47,1.1,.045,dark,.1,.08);
 for(let i=0;i<9;i++){const x=-1.25+i*.115;add(new T.CylinderGeometry(.025+i*.001,.026+i*.001,.075,10).rotateX(Math.PI/2),steel,x,-.43,.15);ring(x,-.43,.014,dark);}
 box(.03,-.38,.04,.36,red,.08,.04,.12);box(.01,-.22,.24,.075,steel,.08,.08);
 box(.4,-.4,.035,.34,steel,.075,.025,-.2);ring(.43,-.23,.045);box(.38,-.5,.055,.13,dark,.085,.04,-.2);
 // Hacksaw frame and serrated blade.
 box(1.0,-.28,.63,.028,steel);box(.69,-.4,.025,.25,steel);box(1.31,-.4,.025,.25,steel);box(1,-.52,.63,.018,steel);
 for(let i=0;i<20;i++)box(.72+i*.029,-.535,.012,.012,steel);
 box(1.39,-.42,.07,.22,red,.08,.04,-.17);
 for(const [m,gs] of buckets){const geometry=mergeGeometries(gs);group.add(new T.Mesh(geometry,m));gs.forEach(g=>g.dispose());}
 return group;
}
export default memo(function WorkshopTools(){const panels=useMemo(()=>[makePanel(0),makePanel(1)],[]);return <>
 <primitive object={panels[0]} position={[-1.88,1.72,-4.8]} rotation={[0,Math.PI/2,0]}/>
 <primitive object={panels[1]} position={[1.88,1.72,-4.8]} rotation={[0,-Math.PI/2,0]}/>
 </>;});
