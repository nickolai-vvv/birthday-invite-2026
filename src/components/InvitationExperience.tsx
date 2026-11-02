"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useState, useRef } from "react";
import {createRace,startRace,chooseCalm,RACE} from "@/lib/scene/race";
import {portraitAt,portraitStart,portraitStep} from "@/data/guests";
import PortraitOverlay from "@/components/ui/PortraitOverlay";
import RaceHud from "@/components/ui/RaceHud";
import SceneLoading from "@/components/ui/SceneLoading";

const RoadScene = dynamic(() => import("@/components/scene/RoadScene"), { ssr: false });

export default function InvitationExperience() {
  useEffect(()=>{
    // Keep pointer clicks from focusing buttons and scrolling them into view.
    // Keyboard focus and activation remain available.
    const preventButtonFocus=(event:MouseEvent)=>{
      if(event.target instanceof Element&&event.target.closest('button'))event.preventDefault();
    };
    document.addEventListener('mousedown',preventButtonFocus);
    return ()=>document.removeEventListener('mousedown',preventButtonFocus);
  },[]);
  const [progress, setProgress] = useState(0);
  const portraitTransition=useRef(false);
  const [portraitPending,setPortraitPending]=useState(false);
  const scrollMotion=useRef({value:0,target:0,frame:0,last:0});
  const glideTo=useCallback((target:number)=>{
    const motion=scrollMotion.current;motion.target=target;
    if(motion.frame)return;
    motion.last=performance.now();
    const tick=(now:number)=>{
      const dt=Math.min(.05,(now-motion.last)/1000);motion.last=now;
      const difference=motion.target-motion.value;
      const inPortraits=motion.value>=.915&&motion.value<.992;
      const atGarages=motion.value>=.76&&motion.value<.915;
      const onDirt=motion.value>=.70&&motion.value<.80;
      const maxSpeed=inPortraits?(portraitTransition.current?.003:.0018):onDirt?.014:atGarages?.032:motion.value>=.992?.003:.085;
      const eased=difference*(1-Math.exp(-dt*7));
      motion.value+=Math.max(-maxSpeed*dt,Math.min(maxSpeed*dt,eased));
      const currentPortrait=portraitAt(motion.value);
      const targetPortrait=portraitAt(motion.target);
      if(portraitTransition.current&&currentPortrait.visible&&currentPortrait.i===targetPortrait.i){
        portraitTransition.current=false;
        setPortraitPending(false);
      }
      if(Math.abs(motion.target-motion.value)<.000005){motion.value=motion.target;motion.frame=0;portraitTransition.current=false;setPortraitPending(false);setProgress(motion.value);return;}
      setProgress(motion.value);motion.frame=requestAnimationFrame(tick);
    };
    motion.frame=requestAnimationFrame(tick);
  },[]);
  useEffect(()=>()=>cancelAnimationFrame(scrollMotion.current.frame),[]);
  const autoToast=useRef(false);
  const portraitStops=useRef({seen:new Set<number>(),until:0,at:0,last:0});
  const race=useRef(createRace()).current;
  const [,redraw]=useState(0);
  const onRace=useCallback(()=>redraw(n=>n+1),[]);
  const choose=(play:boolean)=>{cancelAnimationFrame(scrollMotion.current.frame);Object.assign(scrollMotion.current,{value:RACE.choice,target:RACE.choice,frame:0});setProgress(RACE.choice);if(play){Object.assign(race,createRace());startRace(race);}else chooseCalm(race);onRace();};
  const locked=race.mode!=="STORY"&&race.mode!=="DONE";
  const shown=locked?RACE.choice:progress;
  useEffect(()=>{if(race.mode==="STORY"&&progress>=RACE.choice){race.mode="CHOICE";setProgress(RACE.choice);window.scrollTo({top:RACE.choice*(document.documentElement.scrollHeight-innerHeight),behavior:"instant"});onRace();}},[progress,race,onRace]);
  useLayoutEffect(()=>{
    if(!locked)return;
    cancelAnimationFrame(scrollMotion.current.frame);
    Object.assign(scrollMotion.current,{value:RACE.choice,target:RACE.choice,frame:0});
    setProgress(RACE.choice);
    const previous=document.documentElement.style.overflow;
    document.documentElement.style.overflow="hidden";
    return ()=>{
      cancelAnimationFrame(scrollMotion.current.frame);
      Object.assign(scrollMotion.current,{value:RACE.choice,target:RACE.choice,frame:0});
      setProgress(RACE.choice);
      document.documentElement.style.overflow=previous;
      window.scrollTo({top:RACE.choice*(document.documentElement.scrollHeight-innerHeight),behavior:"instant"});
    };
  },[locked]);
  const [ready,setReady]=useState(false);
  const onReady=useCallback(()=>{
    Object.assign(race,createRace());
    autoToast.current=false;
    window.scrollTo({top:0,behavior:"instant"});
    cancelAnimationFrame(scrollMotion.current.frame);Object.assign(scrollMotion.current,{value:0,target:0,frame:0});
    setProgress(0);
    setReady(true);
    onRace();
  },[race,onRace]);
  useEffect(()=>{
    const previous=window.history.scrollRestoration;
    window.history.scrollRestoration="manual";
    window.scrollTo({top:0,behavior:"instant"});
    return ()=>{window.history.scrollRestoration=previous;};
  },[]);
  useEffect(()=>{if(ready)return;const before=document.documentElement.style.overflow;document.documentElement.style.overflow="hidden";return ()=>{document.documentElement.style.overflow=before;};},[ready]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if(!ready){setProgress(0);return;}
      if(portraitTransition.current)return;
      if(autoToast.current){glideTo(1);return;}
      if(race.mode!=="STORY"&&race.mode!=="DONE"){setProgress(RACE.choice);return;}
      const length = document.documentElement.scrollHeight - window.innerHeight;
      let next=length ? Math.min(1,window.scrollY/length):0;
      if(race.mode==="DONE"&&!race.calm&&next<RACE.choice){
        next=RACE.choice;
        window.scrollTo({top:RACE.choice*length,behavior:"instant"});
      }
      const stops=portraitStops.current,now=performance.now();
      if(now<stops.until){next=stops.at;window.scrollTo({top:next*length,behavior:"instant"});}
      else if(next>stops.last){
        for(let i=0;i<7;i++){
          const at=.915+i*.01+.004;
          if(!stops.seen.has(i)&&stops.last<at&&next>=at){
            stops.seen.add(i);stops.at=at;stops.until=now+1800;next=at;
            window.scrollTo({top:at*length,behavior:"instant"});break;
          }
        }
      }
      if(next<.90)stops.seen.clear();
      stops.last=next;
      glideTo(race.mode==="STORY"?Math.min(RACE.choice,next):next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [ready,race,glideTo]);
  const nextPortrait=()=>{
    if(portraitTransition.current)return;
    const {i}=portraitAt(progress);
    if(i<0||i>6)return;
    portraitTransition.current=true;
    setPortraitPending(true);
    const target=i<6?portraitStart+(i+1)*portraitStep+.004:1;
    if(i===6)autoToast.current=true;
    portraitStops.current.until=0;
    portraitStops.current.seen.add(i);
    if(i<6)portraitStops.current.seen.add(i+1);
    portraitStops.current.last=target;
    window.scrollTo({top:target*(document.documentElement.scrollHeight-innerHeight),behavior:"instant"});
    glideTo(target);
  };
  const chapter = progress < .14 ? 0 : progress < .32 ? 1 : progress < .64 ? 2 : progress < .78 ? 3 : progress < .994 ? 4 : 5;
  const lines = ["Рёв мотора на трассе!", "Они уже выехали....", "", "Последние метры.", "Все СВОи.", "Cheers!"];
  return <main>
    <div className="scene"><RoadScene progress={ready?shown:0} onReady={onReady} race={race} onRace={onRace} /></div>
    {!ready&&<SceneLoading />}
    {ready&&race.mode!=="STORY"&&race.mode!=="CHOICE"&&<RaceHud race={race}/>}
    {ready&&locked&&(race.mode==="CHOICE"||race.mode==="CRASH")&&<div className="race-ui">{race.mode==="CHOICE"||race.mode==="CRASH"?<><h2>{race.mode==="CRASH"?"Столкновение":"Добавим драйва?"}</h2><p className="race-description">Впереди дорога к своим. Выбирай темп.</p><div className="race-options"><button className="calm-option" onClick={()=>race.mode==="CRASH"?window.location.reload():choose(false)}><b>{race.mode==="CRASH"?"Всё заново":"Спокойно"}</b><span>{race.mode==="CRASH"?"Начать историю с самого начала":"Продолжить поездку к гаражу"}</span></button><button onClick={()=>choose(true)}><b>{race.mode==="CRASH"?"Заново шашки":"Шашковать →"}</b><span>30 секунд · WASD · до 200 км/ч</span></button></div></>:<><strong>{race.mode==="SHASHKI"?`${Math.ceil(30-race.time)} сек` : "Едем к повороту"}</strong><p>{Math.round(race.speed*3.6)} км/ч · W / S — скорость · A / D — руль</p></>}</div>}
    {ready&&race.mode==="DONE"&&progress<RACE.choice+.045&&<div className="continue-hint"><span className="scroll-mouse"/><span>Продолжим поездку</span><small>Листай вниз</small></div>}
    <PortraitOverlay progress={shown} onNext={nextPortrait} pending={portraitPending}/>
    <header><strong>N-VVV</strong></header>
    <div style={{display:locked||progress>.89||!lines[chapter]?"none":undefined}} className="caption" key={chapter}><small>0{chapter + 1} / ИСТОРИЯ</small><h1>{lines[chapter]}</h1><p>{chapter === 5 ? "Скоро — дата и место встречи" : "Листай дальше ↓"}</p></div>
    {ready&&progress>=.99999&&<section className="final-invite"><small>N-VVV · ВСЕ СВОИ</small><h2>Приглашаю на День Рождения</h2><p>14 ноября · 14:00</p><span>Встречаемся в гаражике</span><p className="gift-note">Можно приходить и без подарка - я вас всех рад видеть! Мы просто пьем пиво!) А если вдруг хочется что-то подарить, деньги - самый лучший вариант - хочу обновить телефончик 🙂</p><a href="https://yandex.ru/maps/-/CXflbELV" target="_blank" rel="noopener noreferrer">Гараж на карте ↗</a><button onClick={()=>window.location.reload()}>Начать сначала ↺</button></section>}
    <div className="scroll" aria-hidden="true" />
  </main>;
}





