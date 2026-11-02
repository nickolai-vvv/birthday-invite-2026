"use client";
import {useEffect,useRef,useState} from 'react';
import type {Race} from '@/lib/scene/race';
export default function TouchControls({race}:{race:Race}){
 const pointers=useRef(new Map<number,string>()),[held,setHeld]=useState<string[]>([]);
 const sync=()=>{race.touchKeys=[...new Set(pointers.current.values())];setHeld(race.touchKeys);};
 useEffect(()=>{const clear=()=>{pointers.current.clear();race.touchKeys=[];setHeld([]);};window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);return()=>{clear();window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);};},[race]);
 return <div className="touch-controls" aria-label="Управление машиной">{[['KeyA','←'],['KeyD','→'],['KeyS','Тормоз'],['KeyW','Газ']].map(([code,label])=><button key={code} className={`touch-${code} ${held.includes(code)?'held':''}`} aria-label={label} onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,code);sync();}} onPointerUp={e=>{pointers.current.delete(e.pointerId);sync();}} onPointerCancel={e=>{pointers.current.delete(e.pointerId);sync();}} onLostPointerCapture={e=>{pointers.current.delete(e.pointerId);sync();}}>{label}</button>)}</div>;
}
