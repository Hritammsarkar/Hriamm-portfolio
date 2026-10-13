"use client";
import {Download,Plus,ExternalLink} from "lucide-react";
import type {Content} from "./content";
import MotionText from "./text-motion";
export default function ResumePage({content:c}:{content:Content}){
  return <section className="resume-page">
    <div className="section-top"><span className="label">05 / RESUME</span><span className="label">MY EXPERIENCE AND EDUCATION</span></div>
    <div className="resume-page-heading"><MotionText as="h1">My resume.<br/><em>Take a look.</em></MotionText><a className="black-button" href={c.resume} download target="_blank" rel="noopener noreferrer"><Download size={17}/>Download resume</a></div>
    <div className="resume-layout"><aside><span className="label">ABOUT ME</span><MotionText as="h2">{c.name}</MotionText><p>{c.about.degree}</p><p>{c.about.college}</p><p>{c.location}</p><div className="resume-focus"><span className="label">WHAT I WORK ON</span><span>Computer vision</span><span>Backend systems</span><span>Embedded engineering</span></div><a className="round-link" href="/contact">Let's connect<span className="round-plus"><Plus size={17}/></span></a><a className="round-link" href={c.resume} target="_blank" rel="noopener noreferrer">Open PDF in a new tab<ExternalLink size={15}/></a></aside><div className="resume-document"><div className="document-toolbar"><span>RESUME / PDF</span><a href={c.resume} target="_blank" rel="noopener noreferrer" aria-label="Open resume PDF"><ExternalLink size={15}/></a></div><iframe title={"Resume of "+c.name} src={c.resume+"#toolbar=0&navpanes=0&view=FitH"} loading="lazy"/><p>Use the download button to keep a copy or open the PDF in a new tab.</p></div></div>
  </section>;
}
