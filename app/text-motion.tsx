"use client";

import {Children,cloneElement,createElement,isValidElement,useEffect,type CSSProperties,type ReactElement,type ReactNode,type RefObject} from "react";

type MotionTextProps={
  as?:"h1"|"h2"|"h3"|"strong"|"p";
  children:ReactNode;
  className?:string;
};

type InlineProps={children?:ReactNode;className?:string;"aria-hidden"?:boolean|"true"|"false"};

// Whitespace stays between the spans, so wrapping and accessible text stay natural.
export default function MotionText({as="h2",children,className=""}:MotionTextProps){
  let index=0;
  const split=(nodes:ReactNode):ReactNode=>Children.map(nodes,node=>{
    if(typeof node==="string"||typeof node==="number"){
      return String(node).split(/(\s+)/u).map((part,i)=>!part||/^\s+$/u.test(part)?part:
        <span className="motion-word" key={i} style={{"--word-index":index++} as CSSProperties}>{part}</span>);
    }
    if(!isValidElement<InlineProps>(node)||typeof node.type!=="string")return node;
    const hidden=node.props["aria-hidden"];
    if(node.type==="br"||node.type==="svg"||hidden===true||hidden==="true"||node.props.className?.split(/\s+/u).includes("asterisk"))return node;
    return cloneElement(node as ReactElement<InlineProps>,undefined,split(node.props.children));
  });
  return createElement(as,{className:("text-reveal "+className).trim()},split(children));
}

export function useTextMotion(root:RefObject<HTMLElement|null>,page:string){
  useEffect(()=>{
    const surface=root.current;
    if(!surface)return;
    const preference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const isText=(node:HTMLElement)=>node.matches(".text-reveal,.name-display");
    const targets=()=>Array.from(surface.querySelectorAll<HTMLElement>(".text-reveal,.name-display,.reveal"))
      .filter(node=>isText(node)||!node.querySelector(".text-reveal,.name-display"));
    const prepared=new Set<HTMLElement>();
    let frame=0,disposed=false;
    const blocked=()=>!!surface.querySelector(".welcome-intro")||!!surface.querySelector("main[inert]");
    const show=(node:HTMLElement)=>{
      node.classList.add(isText(node)?"motion-visible":"seen");
      node.classList.remove("motion-ready","reveal-ready");
    };
    // Without observation support, the server-rendered text remains visible.
    if(typeof window.IntersectionObserver!=="function")return;
    const observer=new IntersectionObserver(entries=>{
      if(disposed||blocked())return;
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        const node=entry.target as HTMLElement;
        node.classList.add(isText(node)?"motion-visible":"seen");
        observer.unobserve(node);
      }
    },{threshold:.12,rootMargin:"0px"});
    const refresh=()=>{
      frame=0;
      if(disposed)return;
      if(preference.matches){
        observer.disconnect();
        targets().forEach(show);
        return;
      }
      if(blocked()){
        observer.disconnect();
        return;
      }
      for(const node of prepared){
        if(!surface.contains(node)){
          observer.unobserve(node);
          prepared.delete(node);
        }
      }
      for(const node of targets()){
        if(node.classList.contains(isText(node)?"motion-visible":"seen"))continue;
        node.classList.add(isText(node)?"motion-ready":"reveal-ready");
        prepared.add(node);
        observer.observe(node);
      }
    };
    const schedule=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(refresh)};
    // The intro mounts from a child effect. Start after that commit and wait for
    // both its DOM removal and the main surface's inert state to be restored.
    const mutations=new MutationObserver(schedule);
    mutations.observe(surface,{childList:true,subtree:true,attributes:true,attributeFilter:["inert"]});
    preference.addEventListener("change",schedule);
    schedule();
    return()=>{
      disposed=true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change",schedule);
      // Never leave text hidden if this hook stops or a page changes.
      prepared.forEach(node=>node.classList.remove("motion-ready","reveal-ready"));
    };
  },[root,page]);
}
