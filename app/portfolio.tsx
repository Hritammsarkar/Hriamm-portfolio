"use client";

import {useEffect,useRef,useState} from "react";
import {Menu,Plus,Pause,Play} from "lucide-react";
import {Dialog,DialogContent,DialogTitle,DialogDescription} from "@/components/ui/dialog";
import type {Content,Project} from "./content";
import ProjectImage from "./project-image";
import WorldScene from "./world-scene";
import SiteCredits from "./site-credits";
import PortfolioSections from "./portfolio-sections";
import AboutPage from "./about-page";
import ResumePage from "./resume-page";
import WelcomeIntro from "./welcome-intro";
import MotionText,{useTextMotion} from "./text-motion";

import {navigation,type PortfolioPage} from "./navigation";

export default function Portfolio({content:c,page="home"}:{content:Content;page?:PortfolioPage}){
  const [menu,setMenu]=useState(false);
  const [paused,setPaused]=useState(false);
  const [project,setProject]=useState<Project|null>(null);
  const cursor=useRef<HTMLDivElement>(null);
  const root=useRef<HTMLDivElement>(null);
  const menuTrigger=useRef<HTMLButtonElement>(null);
  const projectTrigger=useRef<HTMLElement|null>(null);
  const first=c.name.split(" ")[0];
  useTextMotion(root,page);
  useEffect(()=>{
    if(paused||matchMedia("(prefers-reduced-motion:reduce)").matches||!matchMedia("(pointer:fine)").matches||!cursor.current)return;
    const el=cursor.current;
    let x=-100,y=-100,cx=-100,cy=-100,frame=0;
    const move=(e:PointerEvent)=>{x=e.clientX;y=e.clientY;const target=e.target as HTMLElement;el.dataset.active=target.closest("a,button,[data-cursor]")?"true":"false";el.dataset.label=target.closest("[data-cursor]")?.getAttribute("data-cursor")||"";el.style.opacity="1"};
    const leave=()=>{el.style.opacity="0"};
    const loop=()=>{cx+=(x-cx)*.25;cy+=(y-cy)*.25;el.style.transform="translate3d("+cx+"px,"+cy+"px,0)";frame=requestAnimationFrame(loop)};
    document.addEventListener("pointermove",move);document.addEventListener("pointerleave",leave);frame=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(frame);el.style.opacity="0";document.removeEventListener("pointermove",move);document.removeEventListener("pointerleave",leave)};
  },[paused]);
  useEffect(()=>{
    let frame=0;const scroll=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const total=document.documentElement.scrollHeight-innerHeight;root.current?.style.setProperty("--page-progress",String(total>0?scrollY/total:0))})};
    scroll();addEventListener("scroll",scroll,{passive:true});return()=>{cancelAnimationFrame(frame);removeEventListener("scroll",scroll)};
  },[]);
  const magnetic=(e:React.PointerEvent<HTMLElement>)=>{
    if(paused||e.pointerType!=="mouse"||matchMedia("(prefers-reduced-motion:reduce)").matches)return;
    const b=e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx",((e.clientX-b.left)/b.width-.5)*14+"px");
    e.currentTarget.style.setProperty("--my",((e.clientY-b.top)/b.height-.5)*14+"px");
  };
  const release=(e:React.PointerEvent<HTMLElement>)=>{e.currentTarget.style.setProperty("--mx","0px");e.currentTarget.style.setProperty("--my","0px")};
  const openProject=(item:Project)=>{projectTrigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setProject(item)};
  const motionControl=<button className="motion-toggle" onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>{paused?<Play size={13}/>:<Pause size={13}/>} {paused?"Resume animations":"Pause animations"}</button>;
  return <div ref={root} className={"portfolio page-"+page+(page!=="home"?" inner-page":"")+(paused?" motion-paused":"")}>
    {page==="home"&&<WelcomeIntro name={c.name}/>}
    <div ref={cursor} className="creative-cursor" aria-hidden="true"/>
    <div className="reading-progress" aria-hidden="true"/>
    <header className="site-nav">
      <a className="brand" href="/" aria-label={c.name+" home"}>hs<span>✳</span></a>
      <nav aria-label="Main navigation">{navigation.map(item=><a href={item.href} key={item.page} aria-current={page===item.page?"page":undefined}>{item.name}</a>)}</nav><span className="nav-page-label">{navigation.find(item=>item.page===page)?.name}</span>
      <a className="hire-pill magnetic" onPointerMove={magnetic} onPointerLeave={release} href={c.linkedin} target="_blank" rel="noopener noreferrer">Hire me<span>✳</span></a>
      <button ref={menuTrigger} className="menu-trigger" onClick={()=>setMenu(true)} aria-label="Open menu"><Menu size={24}/></button>
    </header>
    <main>
      {page==="home"&&<section className="opening" id="home">
        <div className="opening-label"><span>HRITAMM SARKAR / PORTFOLIO</span><span>STUDENT. DEVELOPER. STILL LEARNING.</span></div>
        <div className={"name-display"+(first.length>11?" long-name":"")}><h1 aria-label={first.toLowerCase()+"."}>{first.toLowerCase().split("").map((letter,i)=><span className="name-letter" aria-hidden="true" key={i} style={{"--word-index":i} as React.CSSProperties}>{letter}</span>)}<span className="name-period" aria-hidden="true" style={{"--word-index":first.length} as React.CSSProperties}>.</span></h1></div>
        <div className="opening-stage"><div className="sculpture"><WorldScene kind="core" paused={paused} alternate/></div>{motionControl}</div>
        <div className="opening-bottom"><MotionText as="h2">I learn by <br/><em>building.</em><span className="asterisk" aria-hidden="true">✳</span></MotionText><div><MotionText as="p">{c.intro}</MotionText><a className="round-link" href="/projects">See my projects <span className="round-plus"><Plus size={17}/></span></a></div></div>
      </section>}
      {page==="home"&&<div className="home-page-links"><a href="/about"><span className="label">A LITTLE ABOUT ME</span><MotionText as="strong">About <em>me.</em></MotionText><Plus size={23}/></a><a href="/resume"><span className="label">MY EXPERIENCE AND EDUCATION</span><MotionText as="strong">My <em>resume.</em></MotionText><Plus size={23}/></a></div>}
      {page==="about"?<AboutPage content={c}/>:page==="resume"?<ResumePage content={c}/>:page!=="home"?<PortfolioSections page={page} content={c} paused={paused} onProject={openProject}/>:null}
    </main>
    <SiteCredits/>
    <footer className="site-footer"><a className="brand" href="/" aria-label={c.name+" home"}>hs<span>✳</span></a><span>© {new Date().getFullYear()} {c.name}</span><nav aria-label="Footer navigation"><a href="/admin">Private studio</a><a href="/">Home</a></nav></footer>
    <Dialog open={menu} onOpenChange={setMenu}><DialogContent className="full-menu" onCloseAutoFocus={event=>{event.preventDefault();menuTrigger.current?.focus()}}><DialogTitle className="sr-only">Explore the portfolio</DialogTitle><DialogDescription className="sr-only">Navigate to a page or get in touch.</DialogDescription><div className="menu-brand">{c.name}<span>ECE STUDENT / WEST BENGAL</span></div><div className="menu-links">{navigation.map((item,i)=><a key={item.page} href={item.href} aria-current={page===item.page?"page":undefined} onClick={()=>setMenu(false)}><small>0{i+1}</small><span>{item.name}</span><Plus size={30}/></a>)}</div><div className="menu-bottom"><a href={c.github} target="_blank" rel="noopener noreferrer">GitHub</a><a href={c.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="/resume">Resume</a>{motionControl}</div></DialogContent></Dialog>
    <Dialog open={!!project} onOpenChange={v=>{if(!v)setProject(null)}}><DialogContent className="case-dialog" onCloseAutoFocus={event=>{event.preventDefault();projectTrigger.current?.focus()}}>{project&&<><div className="case-top"><span>{project.category}</span><span>{project.status}</span></div><DialogTitle className="case-title">{project.name}</DialogTitle><DialogDescription className="case-description">{project.description}</DialogDescription><div className={"case-art art-"+project.id}><ProjectImage project={project} eager/></div><div className="case-story">{project.details.map((d,i)=><p key={i}>{d}</p>)}</div><div className="case-stack">{project.stack.map(s=><span key={s}>{s}</span>)}</div>{project.link&&<a className="black-button" href={project.link} target="_blank" rel="noopener noreferrer">Open project</a>}</>}</DialogContent></Dialog>
  </div>;
}
