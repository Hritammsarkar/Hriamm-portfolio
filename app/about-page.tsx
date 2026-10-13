"use client";
import {Plus,GraduationCap,Code2} from "lucide-react";
import type {Content} from "./content";
import MotionText from "./text-motion";
export default function AboutPage({content:c}:{content:Content}){
  return <>
    <section className="about-page">
      <div className="section-top"><span className="label">06 / ABOUT ME</span><span className="label">ECE STUDENT / WEST BENGAL</span></div>
      <div className="about-page-heading"><MotionText as="h1">Hi, I’m<br/><em>Hritamm.</em></MotionText><figure className="about-portrait"><img src="/images/hritamm-portrait.jpeg" width={1086} height={1448} alt="Hritamm Sarkar wearing glasses and a black suit" decoding="async"/></figure></div>
      <div className="about-person"><span className="label">HELLO / I'M</span><MotionText as="h2">{c.name}<span aria-hidden="true">✳</span></MotionText><p>{c.about.bio}</p></div>
      <div className="about-identities">
        <article><GraduationCap size={23}/><span className="label">MY STUDIES</span><h3>B.Tech / ECE</h3><p>{c.about.degree}<br/>{c.about.college}</p></article>
        <article><Code2 size={23}/><span className="label">MY PROJECTS</span><h3>Learning by doing.</h3><p>I like figuring out how things work, testing ideas, and learning from what breaks. My projects bring together software, computer vision and electronics.</p></article>
      </div>
      <div className="about-closing"><div><span className="label">WHAT I ENJOY WORKING ON</span><div className="about-interest-list">{c.about.interests.map(s=><span key={s}>{s}</span>)}</div></div><a className="black-button" href="/projects">See my projects<Plus size={17}/></a></div>
    </section>
    <div className="page-next-link"><span className="label">TAKE A LOOK</span><a href="/projects">My <em>projects.</em><Plus size={33}/></a></div>
  </>;
}
