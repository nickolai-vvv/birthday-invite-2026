import {driveAt} from '@/lib/scene/drive';
export const RACE={choice:49/140,duration:30,startSpeed:120/3.6,minSpeed:80/3.6,boostSpeed:220/3.6,maxSpeed:200/3.6,cruise:120/3.6,extension:2200,lanes:[-2.25,2.25],spawnGap:76,curbX:3.45,curbCrashSeconds:2};
export type Mode='STORY'|'CHOICE'|'SHASHKI'|'CRASH'|'APPROACH'|'DONE';
export type Car={x:number,z:number,speed:number,id:number,oncoming:boolean,yaw?:number,lateralSpeed?:number,cruiseSpeed?:number};
export function createRace(){return {touchKeys:[] as string[],mode:'STORY' as Mode,time:0,speed:RACE.cruise,x:driveAt(RACE.choice).x,vx:0,distance:0,blend:0,rpm:4200,gear:4,shift:0,curbTime:0,curbPulse:0,braking:false,boosting:false,acceleration:0,pitch:0,impact:0,crashYaw:0,exitX:2.25,exitYaw:0,exitDistance:0,routeExtension:RACE.extension,calm:false,cars:[] as Car[],seed:0};}
export type Race=ReturnType<typeof createRace>;
export function startRace(r:Race){Object.assign(r,{routeExtension:RACE.extension,calm:false,touchKeys:[],mode:'SHASHKI',rpm:4200,gear:4,shift:0,time:0,speed:RACE.startSpeed,x:driveAt(RACE.choice).x,vx:0,curbTime:0,curbPulse:0,braking:false,boosting:false,acceleration:0,pitch:0,impact:0});r.cars=Array.from({length:12},(_,i)=>({id:i,x:i%3===2?-2.25:2.25,z:r.distance+100+i*RACE.spawnGap,speed:i%3===2?-(80+i%3*8)/3.6:RACE.cruise,oncoming:i%3===2}));}
export function stepRace(r:Race,dt:number,keys:Set<string>){
 if(r.mode==='CRASH'){r.impact+=dt;r.pitch*=Math.exp(-dt*7);return;}
 if(r.mode!=='SHASHKI'&&r.mode!=='APPROACH')return;
 const playing=r.mode==='SHASHKI';
 r.blend=Math.min(1,r.blend+dt/2);
 r.braking=playing&&keys.has('KeyS');
 r.boosting=playing&&!r.braking&&(keys.has('ShiftLeft')||keys.has('ShiftRight'));
 const target=r.braking?RACE.minSpeed:r.boosting?RACE.boostSpeed:playing&&keys.has('KeyW')?RACE.maxSpeed:RACE.cruise;
 const oldSpeed=r.speed;
 if(target>r.speed){
  // Ease acceleration from 40 to 24 km/h per second between 120 and 200.
  const progress=Math.max(0,Math.min(1,(r.speed-RACE.cruise)/(RACE.maxSpeed-RACE.cruise)));
  const accelerationRate=(r.boosting?48:40-16*progress)/3.6;
  r.speed=Math.min(target,r.speed+accelerationRate*dt);
 }else{
  // Limit speed loss: braking is stronger than lifting off the accelerator.
  const decelerationRate=(r.braking?48:10)/3.6;
  r.speed=Math.max(target,r.speed-decelerationRate*dt);
 }
 if(Math.abs(target-r.speed)<.02)r.speed=target;
 const kmh=r.speed*3.6;
 const nextGear=r.gear===3?(kmh>=120?4:3):r.gear===4?(kmh>=160?5:kmh<115?3:4):(kmh<155?4:5);
 if(nextGear!==r.gear){r.shift=.35;r.gear=nextGear;}
 r.shift=Math.max(0,r.shift-dt);
 const rpmTarget=r.gear===3?2000+(kmh-80)*125:r.gear===4?4200+(kmh-120)*70:kmh<=200?4200+(kmh-160)*57.5:6500+(kmh-200)*50;
 r.rpm+=(Math.max(2000,Math.min(7500,rpmTarget))-r.rpm)*(1-Math.exp(-dt*12));
 const acceleration=(r.speed-oldSpeed)/Math.max(dt,.001);
 r.acceleration=acceleration;
 const bodyPitch=r.braking?Math.max(-.065,Math.min(0,acceleration*.0025)):r.boosting?Math.max(0,Math.min(.045,acceleration*.0025)):0;
 r.pitch+=(bodyPitch-r.pitch)*(1-Math.exp(-dt*9));
 const steer=playing?((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0))*7.5:Math.max(-2,Math.min(2,(driveAt(RACE.choice).x-r.x)*1.5));
 r.vx+=(steer-r.vx)*(1-Math.exp(-dt*12));r.x=Math.max(-3.7,Math.min(3.7,r.x+r.vx*dt));
 if(playing){
  const touching=Math.abs(r.x)>=RACE.curbX;
  r.curbTime=touching?r.curbTime+dt:0;
  r.curbPulse=touching?Math.pow(Math.max(0,Math.sin(r.curbTime*Math.PI*8)),6):0;
  if(r.curbTime>=RACE.curbCrashSeconds){r.crashYaw=-Math.atan2(r.vx,r.speed);r.mode='CRASH';r.impact=0;r.speed=0;r.curbPulse=0;return;}
 }
 const before=r.distance;r.distance+=r.speed*dt;
 for(const c of r.cars){
 const sign=c.oncoming?-1:1;
 const gap=Math.min(140,...r.cars.filter(v=>v!==c&&v.oncoming!==c.oncoming).map(v=>Math.abs(v.z-c.z)));
 const clearance=Math.max(0,Math.min(1,(gap-20)/35));
 const inward=clearance*clearance*(3-2*clearance)*(.62+.25*(.5+.5*Math.sin(r.time*.3+c.id*1.7)));
 const targetX=sign*(2.25-inward);
 const desiredVelocity=Math.max(-.24,Math.min(.24,(targetX-c.x)*.75));
 c.lateralSpeed=(c.lateralSpeed??0)+(desiredVelocity-(c.lateralSpeed??0))*(1-Math.exp(-dt*2));
 c.x+=c.lateralSpeed*dt;
 const heading=-Math.atan2(c.lateralSpeed,Math.abs(c.speed))*(c.oncoming?-1:1);
 c.yaw=(c.yaw??0)+(heading-(c.yaw??0))*(1-Math.exp(-dt*3));
 const old=c.z-before;
 if(!c.oncoming){
  c.cruiseSpeed??=c.speed;
  const behind=old< -6.4&&Math.abs(c.x-r.x)<2.25;
  const headway=before-c.z;
  const desiredGap=9;
  const followingSpeed=behind?Math.max(0,Math.min(c.cruiseSpeed,r.speed+(headway-desiredGap)*2.5)):c.cruiseSpeed;
  const rate=followingSpeed<c.speed?6:.7;
  c.speed+=(followingSpeed-c.speed)*(1-Math.exp(-dt*rate));
  // Emergency braking also covers a sudden slowdown or a close merge ahead.
  if(behind)c.speed=Math.min(c.speed,Math.max(0,(r.distance-7.5-c.z)/Math.max(dt,.001)));
 }
 c.z+=c.speed*dt;const relative=c.z-r.distance;if(playing&&Math.abs(c.x-r.x)<1.85&&Math.min(old,relative)<6.4&&Math.max(old,relative)>-6.4){r.crashYaw=-Math.atan2(r.vx,r.speed);r.mode='CRASH';r.impact=0;r.speed=0;return;}
 if(playing&&relative< -40&&(!c.oncoming||r.time<23.5)){
   let ahead=320;
   const occupied=r.cars.filter(v=>v!==c).map(v=>v.z-r.distance);
   while(occupied.some(z=>Math.abs(z-ahead)<RACE.spawnGap))ahead+=RACE.spawnGap;
   c.z=r.distance+ahead;c.x=c.oncoming?-2.25:2.25;c.lateralSpeed=0;c.yaw=0;if(c.cruiseSpeed!==undefined)c.speed=c.cruiseSpeed;
 }}
 if(r.time>=23.5)r.cars=r.cars.filter(c=>!c.oncoming||(c.z-r.distance> -60&&c.z-r.distance<310));
 if(playing){r.time=Math.min(RACE.duration,r.time+dt);if(r.time>=RACE.duration)finishRace(r);}
 if(r.distance>=RACE.extension){r.distance=RACE.extension;finishRace(r);}
}


export function finishRace(r:Race){r.exitX=r.x;r.exitYaw=r.mode==='CRASH'?r.crashYaw:-Math.atan2(r.vx,Math.max(1,r.speed));r.exitDistance=r.distance;r.routeExtension=r.distance;r.cars=[];r.curbTime=0;r.curbPulse=0;r.mode='DONE';}
const blend=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*t*(10+t*(-15+6*t));};
export function racePose(r:Race,p:number){
 const base=driveAt(p);
 if(r.mode==='DONE'&&r.calm&&p<=RACE.choice)return {...base,pitch:0};
 if(r.mode==='DONE'){
  const laneStart=r.calm?.49:RACE.choice;
  const t=Math.max(0,Math.min(1,(p-laneStart)/.12)),k=blend(t);
  const offset=r.exitDistance+(r.routeExtension-r.exitDistance)*blend((p-RACE.choice)/(.64-RACE.choice));
  const dx=(2.25-r.exitX)*30*t*t*(1-t)*(1-t)/.12;
  const yaw=-Math.atan2(dx,400+(r.routeExtension-r.exitDistance)/(.64-RACE.choice));
  return {x:r.exitX+(2.25-r.exitX)*k,z:base.z-offset,distance:base.distance+offset,yaw: r.exitYaw*(1-blend(t*4))+yaw,pitch:r.pitch*(1-k)};
 }
 const active=['SHASHKI','CRASH','APPROACH'].includes(r.mode);
 return {x:active?r.x:base.x,z:base.z-r.distance,distance:base.distance+r.distance,yaw:r.mode==='CRASH'?r.crashYaw:active?-Math.atan2(r.vx,r.speed):base.yaw,pitch:r.pitch};
}

export function chooseCalm(r:Race){r.calm=r.distance===0;r.routeExtension=r.distance;finishRace(r);}


