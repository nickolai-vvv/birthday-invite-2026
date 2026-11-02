import * as T from 'three';
export const CAR_Z=-183.775;
export const TABLE={x:12.5,z:-190};
export const ease=(p:number,a:number,b:number)=>T.MathUtils.smoothstep(p,a,b);
type Point=[number,number];
const cache=new Map<string,T.CurvePath<T.Vector3>>();
export function path(points:Point[],t:number){
  const key=JSON.stringify(points);let c=cache.get(key);
  if(!c){c=new T.CurvePath();const v=points.map(([x,z])=>new T.Vector3(x,0,z));let prev=v[0];for(let i=1;i<v.length-1;i++){const a=v[i-1],b=v[i],d=v[i+1],r=Math.min(.6,a.distanceTo(b)*.3,b.distanceTo(d)*.3);if(r<.001)continue;const entry=b.clone().addScaledVector(a.clone().sub(b).normalize(),r),exit=b.clone().addScaledVector(d.clone().sub(b).normalize(),r);c.add(new T.LineCurve3(prev,entry));c.add(new T.QuadraticBezierCurve3(entry,b,exit));prev=exit;}c.add(new T.LineCurve3(prev,v.at(-1)!));cache.set(key,c);}
  const u=T.MathUtils.clamp(t,0,1),v=c.getPoint(u),d=c.getTangent(u);
  return {x:v.x,z:v.z,angle:Math.atan2(d.x,d.z),walk:u>0&&u<1?u*c.getLength():0,length:c.getLength()};
}

// Sequential entrance: walk into the portrait, pause, then continue around the table.
const slots:Point[]=[[13.9,-188.5],[12.7,-188.5],[11.5,-188.5],[13.9,-191.5],[12.7,-191.5],[11.5,-191.5]];
function entry(p:number,i:number){const t=(p-(.915+i*.01))/.01;const move=t<.22?ease(t,0,.22)*.32:t<.65?.32:.32+.68*ease(t,.65,1);return {t,move};}
export function queuePose(p:number,i:number){
 let advance=0,walking=false;
 for(let j=0;j<i;j++){
  const start=.915+j*.01+.0008,end=start+.004;
  advance+=ease(p,start,end);
  if(p>start&&p<end)walking=true;
 }
 return {x:6.2-i*.85+advance*.85,z:-190,angle:Math.PI/2,walk:walking?advance*.85:0};
}
export function guestPose(p:number,i:number){
 const [tx,tz]=slots[i],{t,move}=entry(p,i);
 const pose=move<=.32?path([[6.2,-190],[9.3,-190]],move/.32):path([[9.3,-190],[10,-190],[10.5,tz],[tx,tz]],(move-.32)/.68);
 if(t>=1)pose.angle=Math.atan2(TABLE.x-pose.x,TABLE.z-pose.z);
 if(t>=.22&&t<=.65){pose.walk=0;pose.angle=Math.PI/2;}
 return {...pose,emerge:1,visible:p>=.88,arrived:t>=1,...(t<0?queuePose(p,i):{})};
}
export function driverPose(p:number){
 const {t,move}=entry(p,6),place=ease(p,.986,.991);
 const pose=move<=.32?path([[6.2,-190],[9.3,-190]],move/.32):path([[9.3,-190],[10.5,-190]],(move-.32)/.68);
 if(t>=.22&&t<=.65){pose.walk=0;pose.angle=Math.PI/2;}
 return {...pose,...(t<0?queuePose(p,6):{}),visible:p>=.88,emerge:1,carry:p<.995,carryWeight:1-ease(p,.991,.995),place,pickup:1};
}
export function cratePose(p:number){
 const driver=driverPose(p),place=driver.place;
 // Same shoulder, wrist and carrying angle as Guest; midpoint between both hands.
 const armAngle=-1.25-driver.place*.25,unit=1.8/32;
 const forward=-10*unit*Math.sin(armAngle);
 const handY=24*unit-10*unit*Math.cos(armAngle);
 const hands={x:driver.x+Math.sin(driver.angle)*forward,y:handY,z:driver.z+Math.cos(driver.angle)*forward};
 return {x:T.MathUtils.lerp(hands.x,TABLE.x,place),y:T.MathUtils.lerp(hands.y,1.02,place)+Math.sin(place*Math.PI)*.1,z:T.MathUtils.lerp(hands.z,TABLE.z,place),angle:driver.angle};
}
