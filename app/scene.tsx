"use client";

import {useEffect,useRef,useState} from "react";
import type * as Three from "three";
import RegionMap from "./region-map";

type View="globe"|"approaching"|"map"|"returning";
export default function Scene({paused=false}:{paused?:boolean}){
  const host=useRef<HTMLDivElement>(null),pause=useRef(paused);
  const flight=useRef<((locate:boolean)=>void)|null>(null),phase=useRef<View>("globe");
  const [view,setView]=useState<View>("globe"),[failed,setFailed]=useState(false),[ready,setReady]=useState(false),[showMap,setShowMap]=useState(false);
  useEffect(()=>{pause.current=paused},[paused]);
  useEffect(()=>{
    let cancelled=false,started=false,dispose=()=>{};
    const initialize=()=>import("three").then(T=>{
      if(cancelled||!host.current)return;
      const el=host.current;let renderer:Three.WebGLRenderer;
      try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"})}catch{setFailed(true);return}
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x000000,0);
      renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;el.appendChild(renderer.domElement);
      const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.05,100);camera.position.z=5.9;
      const group=new T.Group();scene.add(group);
      const resources:Array<{dispose:()=>void}>=[];
      const add=(geo:Three.BufferGeometry,mat:Three.Material)=>{resources.push(geo,mat);const mesh=new T.Mesh(geo,mat);group.add(mesh);return mesh};
      scene.add(new T.AmbientLight(0xffffff,1.1));
      const key=new T.DirectionalLight(0xffe1c5,6);key.position.set(-3,5,5);scene.add(key);
      const rim=new T.DirectionalLight(0xa2b5c8,4);rim.position.set(4,-1,-2);scene.add(rim);
      const fill=new T.PointLight(0xffffff,25);fill.position.set(3,1,3);scene.add(fill);
      const material=new T.MeshStandardMaterial({color:0x858f98,roughness:.95,metalness:.12});
      const texture=new T.TextureLoader().load("/earth.jpg",()=>{if(!cancelled)renderer.render(scene,camera)});texture.colorSpace=T.SRGBColorSpace;resources.push(texture);material.map=texture;
      add(new T.SphereGeometry(1.7,64,48),material);
      add(new T.SphereGeometry(1.725,36,24),new T.MeshBasicMaterial({color:0xb5c8d5,transparent:true,opacity:.035,wireframe:true}));
      const lat=23.7*Math.PI/180,lon=87.8*Math.PI/180;
      const loc=new T.Vector3(Math.cos(lon)*Math.cos(lat),Math.sin(lat),-Math.sin(lon)*Math.cos(lat));
      const marker=add(new T.SphereGeometry(.034,16,16),new T.MeshBasicMaterial({color:0xf8c499}));marker.position.copy(loc.clone().multiplyScalar(1.73));
      const ring=add(new T.TorusGeometry(.07,.008,8,48),new T.MeshBasicMaterial({color:0xe8b084}));ring.position.copy(loc.clone().multiplyScalar(1.73));ring.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),loc);
      group.rotation.set(lat,Math.PI*1.5-lon+.22,0,"XYZ");
      const start=group.quaternion.clone(),destination=new T.Quaternion().setFromEuler(new T.Euler(lat,Math.PI*1.5-lon,0,"XYZ"));
      const points=[];for(let i=0;i<380;i++){const n=i*2.39996,z=1-2*(i+.5)/380,r=Math.sqrt(1-z*z);points.push(7*r*Math.cos(n),7*r*Math.sin(n),7*z)}
      const starsGeo=new T.BufferGeometry();starsGeo.setAttribute("position",new T.Float32BufferAttribute(points,3));const starsMat=new T.PointsMaterial({color:0xc4c8ce,size:.018,transparent:true,opacity:.5});scene.add(new T.Points(starsGeo,starsMat));resources.push(starsGeo,starsMat);
      const resize=()=>{const {width,height}=el.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.render(scene,camera)};
      const ro=new ResizeObserver(resize);ro.observe(el);resize();setReady(true);
      let visible=true,dragging=false,lastX=0,lastY=0,frame=0,last=0;
      const reduced=matchMedia("(prefers-reduced-motion:reduce)");
      const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting},{rootMargin:"100px"});observer.observe(el);
      type Tween={started:number;duration:number;from:Three.Quaternion;to:Three.Quaternion;fromZ:number;toZ:number;fromFov:number;toFov:number;locate:boolean};
      let tween:Tween|null=null;
      const changeView=(next:View)=>{phase.current=next;setView(next);if(next==="map")setShowMap(true);else if(next==="globe")setShowMap(false)};
      flight.current=locate=>{
        dragging=false;
        changeView(locate?"approaching":"returning");
        tween={started:performance.now(),duration:reduced.matches||pause.current?0:locate?1650:1400,from:group.quaternion.clone(),to:locate?destination:start,fromZ:camera.position.z,toZ:locate?2.65:5.9,fromFov:camera.fov,toFov:locate?30:35,locate};
      };
      const move=(e:PointerEvent)=>{
        if(dragging&&phase.current==="globe"){
          group.rotateOnWorldAxis(new T.Vector3(0,1,0),(e.clientX-lastX)*.004);
          group.rotateOnWorldAxis(new T.Vector3(1,0,0),(e.clientY-lastY)*.004);
        }
        lastX=e.clientX;lastY=e.clientY;
      };
      const down=(e:PointerEvent)=>{if(phase.current!=="globe")return;dragging=true;lastX=e.clientX;lastY=e.clientY;el.setPointerCapture(e.pointerId)};
      const up=()=>{dragging=false};
      el.addEventListener("pointermove",move);el.addEventListener("pointerdown",down);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
      const smooth=(v:number)=>v*v*(3-2*v);
      const tick=(time:number)=>{
        frame=requestAnimationFrame(tick);
        if(document.hidden||phase.current==="map"||time-last<32||(!visible&&!tween))return;
        last=time;
        if(tween){
          const progress=tween.duration===0||reduced.matches?1:Math.max(0,Math.min(1,(time-tween.started)/tween.duration)),eased=smooth(progress);
          const turn=smooth(Math.min(1,progress*1.8));
          group.quaternion.slerpQuaternions(tween.from,tween.to,turn);
          camera.position.z=T.MathUtils.lerp(tween.fromZ,tween.toZ,eased);camera.fov=T.MathUtils.lerp(tween.fromFov,tween.toFov,eased);camera.updateProjectionMatrix();
          marker.scale.setScalar(1);
          if(progress===1){const locate=tween.locate;tween=null;changeView(locate?"map":"globe")}
        }else if(!pause.current&&!reduced.matches&&!dragging){marker.scale.setScalar(1+Math.sin(time*.003)*.12)}
        renderer.render(scene,camera);
      };
      frame=requestAnimationFrame(tick);
      const lost=(e:Event)=>{e.preventDefault();setFailed(true)};renderer.domElement.addEventListener("webglcontextlost",lost);
      dispose=()=>{cancelAnimationFrame(frame);flight.current=null;ro.disconnect();observer.disconnect();el.removeEventListener("pointermove",move);el.removeEventListener("pointerdown",down);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",up);renderer.domElement.removeEventListener("webglcontextlost",lost);resources.forEach(r=>r.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()};
    }).catch(()=>setFailed(true));
    const activation=new IntersectionObserver(entries=>{if(!started&&entries.some(e=>e.isIntersecting)){started=true;activation.disconnect();void initialize()}},{rootMargin:"200px"});if(host.current)activation.observe(host.current);
    return()=>{cancelled=true;activation.disconnect();dispose()};
  },[]);
  const locating=view==="approaching",returning=view==="returning";
  const navigate=()=>{
    if(flight.current&&!failed)flight.current(view==="globe"||view==="returning");
    else {const next=view==="map"?"globe":"map";phase.current=next;setView(next);setShowMap(next==="map")}
  };
  return <div className="scene globe-scene" data-view={view} data-map-overlay={showMap||undefined} aria-busy={locating||returning}>
    <div ref={host} className="scene-canvas" role="img" aria-label="Interactive Earth marking West Bengal, India. Drag to rotate."/>
    {failed&&view!=="map"&&<div className="scene-fallback"><span>23.7° N / 87.8° E</span><strong>West Bengal, India</strong></div>}
    {showMap&&<RegionMap/>}
    <button className="globe-reset" onClick={navigate} disabled={!ready&&!failed}>{locating?"Cancel zoom":returning?"Locate again":view==="map"?"Back to globe":!ready&&!failed?"Preparing globe…":"Locate West Bengal"}<span aria-hidden="true">{view==="map"||locating?"↗":"⊕"}</span></button>
    <span className="sr-only" role="status" aria-live="polite">{view==="map"?"West Bengal regional map is now open.":locating?"Flying toward West Bengal.":""}</span>
  </div>;
}

