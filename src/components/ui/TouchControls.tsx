"use client";
import {useEffect,useRef,useState} from 'react';
import type {Race} from '@/lib/scene/race';
export default function TouchControls({race}:{race:Race}){
 const pointers=useRef(new Map<number,string>()),[held,setHeld]=useState<string[]>([]);
 const sync=()=>{race.touchKeys=[...new Set(pointers.current.values())];setHeld(race.touchKeys);};
 useEffect(()=>{
  const controls=document.querySelector<HTMLDivElement>('.touch-controls');
  if(!controls)return;
  const prevent=(event:Event)=>{if(event.cancelable)event.preventDefault();};
  const touchStart=(event:TouchEvent)=>{
   prevent(event);
   for(const touch of Array.from(event.changedTouches)){
    const button=(touch.target as Element).closest<HTMLButtonElement>('button');
    const code=button?.className.match(/touch-(Key[A-Z])/)?.[1];
    if(code)pointers.current.set(touch.identifier,code);
   }
   sync();
  };
  const touchEnd=(event:TouchEvent)=>{
   prevent(event);
   for(const touch of Array.from(event.changedTouches))pointers.current.delete(touch.identifier);
   sync();
  };
  controls.addEventListener('touchstart',touchStart,{passive:false});
  controls.addEventListener('touchmove',prevent,{passive:false});
  controls.addEventListener('touchend',touchEnd,{passive:false});
  controls.addEventListener('touchcancel',touchEnd,{passive:false});
  controls.addEventListener('contextmenu',prevent);
  controls.addEventListener('selectstart',prevent);
  return ()=>{
   controls.removeEventListener('touchstart',touchStart);
   controls.removeEventListener('touchmove',prevent);
   controls.removeEventListener('touchend',touchEnd);
   controls.removeEventListener('touchcancel',touchEnd);
   controls.removeEventListener('contextmenu',prevent);
   controls.removeEventListener('selectstart',prevent);
  };
 },[race]);
 useEffect(()=>{const clear=()=>{pointers.current.clear();race.touchKeys=[];setHeld([]);};window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);return()=>{clear();window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);};},[race]);
 return <div className="touch-controls" aria-label="Управление машиной">{[['KeyA','←'],['KeyD','→'],['KeyS','Тормоз'],['KeyW','Газ']].map(([code,label])=><button key={code} className={`touch-${code} ${held.includes(code)?'held':''}`} aria-label={label} onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{if(e.pointerType==="touch")return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,code);sync();}} onPointerUp={e=>{if(e.pointerType==="touch")return;pointers.current.delete(e.pointerId);sync();}} onPointerCancel={e=>{if(e.pointerType==="touch")return;pointers.current.delete(e.pointerId);sync();}} onLostPointerCapture={e=>{if(e.pointerType==="touch")return;pointers.current.delete(e.pointerId);sync();}}>{label}</button>)}</div>;
}
