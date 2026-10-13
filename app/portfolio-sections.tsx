"use client";

import {useEffect,useRef,useState} from "react";
import {Plus,Minus,Download,Code2,Link2,Mail,ChevronLeft,ChevronRight} from "lucide-react";
import type {Content,Project} from "./content";
import type {PortfolioPage} from "./navigation";
import ProjectImage from "./project-image";
import Scene from "./scene";
import Charts from "./charts";
import MotionText from "./text-motion";
import MacBook from "./macbook";

const worldFor=(p:Project)=>p.id==="retinascan"?"lens":p.id==="suntracker"?"solar":"signal";
export default function PortfolioSections({content:c,paused,onProject,page}:{content:Content;paused:boolean;onProject:(p:Project)=>void;page:PortfolioPage}){
  const [active,setActive]=useState(0),[skill,setSkill]=useState(0);
  const work=useRef<HTMLElement>(null),laptop=useRef<HTMLDivElement>(null);
  const laptopScroll=useRef<HTMLDivElement>(null),laptopSticky=useRef<HTMLDivElement>(null);
  const project=c.projects[Math.min(active,c.projects.length-1)];
  const category=c.skills[Math.min(skill,c.skills.length-1)];
  const certificates=c.certificates.filter(cert=>!(cert.title==="New certificate"&&cert.issuer==="Who issued it?"&&cert.description==="What did you learn?"&&!cert.url));
  useEffect(()=>{
    let frame=0;
    const reduced=matchMedia("(prefers-reduced-motion:reduce)");
    const update=()=>{
      if(frame)return;frame=requestAnimationFrame(()=>{
        frame=0;
        if(work.current&&matchMedia("(min-width:801px)").matches){
          const b=work.current.getBoundingClientRect(),distance=b.height-innerHeight;
          const progress=Math.min(.9999,Math.max(0,-b.top/Math.max(1,distance)));
          setActive(Math.min(c.projects.length-1,Math.floor(progress*c.projects.length)));
          work.current.style.setProperty("--work-progress",String(progress));
        }
        if(laptop.current&&laptopScroll.current&&laptopSticky.current){
          const sticky=laptopSticky.current;
          const height=sticky.getBoundingClientRect().height;
          laptopScroll.current.style.setProperty("--macbook-height",height+"px");
          const track=laptopScroll.current.getBoundingClientRect();
          const top=parseFloat(getComputedStyle(sticky).top)||0;
          const distance=Math.max(1,track.height-height);
          const progress=Math.max(0,Math.min(1,(top-track.top)/(distance*.9)));
          laptop.current.style.setProperty("--lid-progress",String(paused||reduced.matches?1:progress));
        }
      });
    };
    update();addEventListener("scroll",update,{passive:true});addEventListener("resize",update);
    reduced.addEventListener("change",update);
    const observer=new ResizeObserver(update);
    if(laptopSticky.current)observer.observe(laptopSticky.current);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener("scroll",update);removeEventListener("resize",update);reduced.removeEventListener("change",update)};
  },[c.projects.length,paused]);
  const jump=(index:number)=>{
    if(!work.current)return;
    const i=Math.max(0,Math.min(c.projects.length-1,index));
    const y=work.current.getBoundingClientRect().top+scrollY;
    const distance=work.current.offsetHeight-innerHeight;
    scrollTo({top:y+distance*(i+.12)/c.projects.length,behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"});
  };
  return <>
    {page==="projects"&&<><section className="work-intro" id="work-heading"><div><span className="label">02 / SELECTED WORK</span><MotionText as="h1">Things I’ve<br/><em>built.</em></MotionText></div><p>From computer vision to electronics,<br/>these projects are where I put<br/>what I’m learning into practice.</p><span className="work-intro-star" aria-hidden="true">✳</span></section>
    <section ref={work} id="projects" className="work-sequence" style={{"--project-count":c.projects.length} as React.CSSProperties}>
      <div className={"work-pin world-"+worldFor(project)}>
        <div className="work-topline"><span className="label">MY PROJECTS</span><span className="label">SCROLL TO SEE THE NEXT PROJECT</span></div>
        <div className="work-index"><span>{String(active+1).padStart(2,"0")}</span><small>/{String(c.projects.length).padStart(2,"0")}</small></div>
        <div className="work-title" key={project.id}><span className="label">{project.category}</span><MotionText as="h3">{project.name}</MotionText></div>
        <div className="project-world"><ProjectImage project={project} eager/></div>
        <div className="work-story" key={"story-"+project.id}><p>{project.description}</p><span className="project-state">{project.status}</span><button className="white-button" onClick={()=>onProject(project)}>Read about this project<span><Plus size={16}/></span></button></div>
        <div className="work-bottomline"><div className="project-tabs" aria-label="Select project">{c.projects.map((p,i)=><button className={i===active?"active":""} key={p.id} onClick={()=>jump(i)} aria-pressed={i===active}><span>{String(i+1).padStart(2,"0")}</span>{p.name}</button>)}</div><div className="project-step"><button onClick={()=>jump(active-1)} disabled={active===0} aria-label="Previous project"><ChevronLeft size={18}/></button><button onClick={()=>jump(active+1)} disabled={active===c.projects.length-1} aria-label="Next project"><ChevronRight size={18}/></button></div></div>
        <div className="work-progress"><span/></div>
      </div>
      <div className="mobile-projects">{c.projects.map((p,i)=><article key={p.id} className={"mobile-project world-"+worldFor(p)}><div className="mobile-work-meta"><span className="label">0{i+1} / {p.status}</span><span className="label">{p.category}</span></div><MotionText as="h3">{p.name}</MotionText><div className="mobile-world"><ProjectImage project={p}/></div><p>{p.description}</p><button className="white-button" onClick={()=>onProject(p)}>Read about this project<Plus size={16}/></button></article>)}</div>
    </section></>}

    {page==="skills"&&<section id="skills" className="skills-section">
      <div className="section-top"><span className="label">03 / SKILLS</span><span className="label">LEARNING AS I GO</span></div>
      <div className="skills-heading reveal"><MotionText as="h1">What I<br/><em>work with.</em></MotionText><p>Tools I use in my projects,<br/>and keep learning as I go.</p></div>
      <div className="skills-browser"><div className="skill-navigation" aria-label="Skill categories">{c.skills.map((s,i)=><button className={skill===i?"active":""} key={s.name} onClick={()=>setSkill(i)} onPointerEnter={e=>{if(e.pointerType==="mouse")setSkill(i)}} aria-pressed={skill===i}><small>{String(i+1).padStart(2,"0")}</small><span>{s.name}</span>{skill===i?<Minus size={20}/>:<Plus size={20}/>}</button>)}</div><div className="skill-display" key={category.name}><span className="label">TOOLS I USE / {category.name}</span><div className="skill-cloud">{category.items.map((s,i)=><span key={s} style={{"--i":i} as React.CSSProperties}>{s}</span>)}</div><div className="skill-display-footer"><span>LEARNED THROUGH PROJECTS.<br/>IMPROVED WITH PRACTICE.</span><span>✳</span></div></div></div>
      <div className="foundations"><span className="label">CORE CONCEPTS</span><p>Data Structures & Algorithms / Object-Oriented Programming / System Design / DBMS / Computer Networks / REST Architecture</p></div>
      <div className="chart-header"><MotionText as="h3">Where I use<br/><em>these skills.</em></MotionText><p>The areas my projects cover,<br/>and the tools I use to build them.</p></div><Charts projects={c.projects}/>
    </section>}

    {page==="projects"&&c.projects.some(p=>p.id==="retinascan")&&<section className="architecture-section">
      <div className="architecture-heading reveal"><span className="label">INSIDE RETINASCAN AI</span><MotionText as="h2">How RetinaScan<br/><em>fits together.</em></MotionText></div>
      <div className="macbook-scroll" ref={laptopScroll}>
        <div className="macbook-sticky" ref={laptopSticky}>
          <MacBook stageRef={laptop}/>
          <p className="macbook-scroll-hint">Scroll down to open · Scroll up to close</p>
          <button className="black-button" onClick={()=>onProject(c.projects.find(p=>p.id==="retinascan")!)}>Inside RetinaScan AI<Plus size={17}/></button>
        </div>
      </div>
    </section>}

    {page==="certificates"&&<section id="certificates" className="credentials-section">
      <div className="section-top"><span className="label">04 / CERTIFICATES</span><span className="label">EDUCATION & CREDENTIALS</span></div>
      <div className="credentials-heading reveal"><MotionText as="h1">What I’ve<br/><em>learned.</em></MotionText><span className="learning-mark" aria-hidden="true">✳</span></div>
      <div className="credentials-grid"><div className="education-block"><span className="label">2025 — 2029 / ONGOING</span><h3>{c.about.college}</h3><p>{c.about.degree}</p><div className="gpa"><strong>8.03</strong><span>/ 10 GPA<br/>ACADEMIC RECORD</span></div></div><div>{certificates.map((cert,i)=><article className="credential-card" key={i}><div className="credential-top"><span className="label">{cert.date}</span><span className="credential-symbol" aria-hidden="true">✳</span></div><h3>{cert.title}</h3><p className="credential-issuer">{cert.issuer}</p><p>{cert.description}</p>{cert.url?<a className="round-link" href={cert.url} target="_blank" rel="noopener noreferrer">View credential <span className="round-plus"><Plus size={16}/></span></a>:<span className="credential-note">Completed virtual job simulation</span>}</article>)}</div></div>
      <div className="resume-strip"><div><span className="label">MY EXPERIENCE AND EDUCATION</span><h3>Read my resume.</h3></div><a className="black-button" href="/resume"><Download size={16}/>View my resume</a></div>
    </section>}

    {page==="contact"&&<section id="contact" className="contact-section">
      <div className="contact-top"><span className="label">07 / CONTACT</span><span className="label">WEST BENGAL, INDIA</span></div>
      <div className="contact-layout"><div className="contact-text"><MotionText as="h1">Let’s work<br/><em>together.</em></MotionText><p>I’m based in {c.location}.<br/>I’m open to internships and projects<br/>where I can learn and contribute.</p><a className="white-button" href={c.linkedin} target="_blank" rel="noopener noreferrer">Connect on LinkedIn <span><Plus size={16}/></span></a><a className="contact-email" href={"mailto:"+c.email}>{c.email}</a></div><div className="contact-globe"><Scene paused={paused}/><div className="location-label"><span>⊕</span><div>{c.location}<small>23.7° N / 87.8° E · REGION</small></div></div></div></div>
      <div className="contact-links"><a href={c.github} target="_blank" rel="noopener noreferrer"><Code2 size={17}/>GitHub<span>Hritammsarkar</span></a><a href={c.linkedin} target="_blank" rel="noopener noreferrer"><Link2 size={17}/>LinkedIn<span>Let's connect</span></a><a href={"mailto:"+c.email}><Mail size={17}/>Email<span>Say hello</span></a></div>
    </section>}
  </>;
}

