"use client";
import {useCallback,useEffect,useRef,useState} from "react";
export default function WelcomeIntro({name}:{name:string}){
  const [visible,setVisible]=useState(false),[closing,setClosing]=useState(false);
  const decision=useRef<"fresh"|"show"|"skip">("fresh"),exiting=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const restore=useRef(()=>{});
  const close=useCallback(()=>{
    if(exiting.current)return;exiting.current=true;
    timers.current.forEach(clearTimeout);setClosing(true);restore.current();
    timers.current=[setTimeout(()=>setVisible(false),600)];
  },[]);
  useEffect(()=>{
    if(decision.current==="fresh"){
      decision.current="show";
      if(matchMedia("(prefers-reduced-motion:reduce)").matches)decision.current="skip";
    }
    if(decision.current==="skip")return;
    setVisible(true);
    const previous=document.documentElement.style.overflow;
    const surfaces=Array.from(document.querySelectorAll<HTMLElement>(".portfolio>.site-nav,.portfolio>main,.portfolio>.site-credits,.portfolio>.site-footer"));
    const states=surfaces.map(el=>el.inert);
    document.documentElement.style.overflow="hidden";surfaces.forEach(el=>{el.inert=true});
    restore.current=()=>{document.documentElement.style.overflow=previous;surfaces.forEach((el,i)=>{el.inert=states[i]})};
    timers.current=[setTimeout(close,2600)];
    const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")close()};
    addEventListener("keydown",escape);
    return()=>{timers.current.forEach(clearTimeout);removeEventListener("keydown",escape);restore.current()};
  },[close]);
  if(!visible)return null;
  return <div className={"welcome-intro "+(closing?"welcome-leaving":"")} role="dialog" aria-modal="true" aria-hidden={closing||undefined} aria-label={"Welcome to "+name+"'s portfolio"} onKeyDown={e=>{if(!closing&&e.key==="Tab")e.preventDefault()}}>
    <button className="welcome-skip" onClick={close} autoFocus>Skip intro<span aria-hidden="true">↗</span></button>
    <div className="welcome-orbits" aria-hidden="true"><span/><span/><span/><b>✳</b></div>
    <div className="welcome-copy"><p className="label">WELCOME TO</p><div className="welcome-name" aria-hidden="true">{name.split(" ")[0].toLowerCase().split("").map((letter,i)=><span key={i} style={{"--letter":i} as React.CSSProperties}>{letter}</span>)}<span className="welcome-period">.</span></div><p className="welcome-profile">Come take a look around.</p></div>
    <div className="welcome-bottom"><span>CODE / ELECTRONICS / LEARNING</span><span>GLAD YOU’RE HERE.</span><div className="welcome-progress"><span/></div></div>
  </div>;
}
