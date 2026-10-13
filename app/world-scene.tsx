"use client";

import {useEffect,useRef,useState} from "react";
import type * as Three from "three";

export type WorldKind = "core" | "lens" | "signal" | "solar" | "rhythm";
export default function WorldScene({kind="core",paused=false,alternate=false}:{kind?:WorldKind;paused?:boolean;alternate?:boolean}){
  const host=useRef<HTMLDivElement>(null);
  const controls=useRef({paused,alternate});
  const [unavailable,setUnavailable]=useState(false);
  const [ready,setReady]=useState(false);
  useEffect(()=>{controls.current={paused,alternate}},[paused,alternate]);
  useEffect(()=>{
    let cancelled=false,started=false,cleanup=()=>{};
    setReady(false);setUnavailable(false);
    const initialize=()=>Promise.all([import("three"),import("three/addons/environments/RoomEnvironment.js")]).then(([T,{RoomEnvironment}])=>{
      if(cancelled||!host.current)return;
      const el=host.current;let renderer:Three.WebGLRenderer;
      try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"})}catch{setUnavailable(true);return}
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
      renderer.setClearColor(0x000000,0);
      renderer.outputColorSpace=T.SRGBColorSpace;
      renderer.toneMapping=T.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.4;
      el.appendChild(renderer.domElement);
      const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,100);
      camera.position.set(0,0,kind==="core"?6.6:7.4);
      const environment=new RoomEnvironment();
      const pmrem=new T.PMREMGenerator(renderer);
      const envTexture=pmrem.fromScene(environment,.025).texture;
      scene.environment=envTexture;
      environment.dispose();pmrem.dispose();
      const group=new T.Group();scene.add(group);
      const resources:Array<{dispose:()=>void}>=[envTexture];
      const mesh=(geometry:Three.BufferGeometry,material:Three.Material,parent:Three.Object3D=group)=>{
        resources.push(geometry,material);const m=new T.Mesh(geometry,material);parent.add(m);return m;
      };
      const chrome=new T.MeshPhysicalMaterial({color:0xdde2ea,metalness:1,roughness:.13,clearcoat:1,clearcoatRoughness:.1});
      const dark=new T.MeshStandardMaterial({color:0x101315,metalness:.8,roughness:.3});
      const red=new T.MeshStandardMaterial({color:0xdd210d,metalness:.35,roughness:.3});
      scene.add(new T.AmbientLight(0xffffff,2));
      const light=new T.DirectionalLight(0xffffff,5);light.position.set(3,4,5);scene.add(light);
      const edge=new T.DirectionalLight(kind==="lens"?0x98ffd6:0xff5b35,3);edge.position.set(-4,-1,2);scene.add(edge);
      let core:Three.Mesh|undefined,rotor:Three.Group|undefined;
      const satellites:Three.Mesh[]=[];
      if(kind==="core"){
        const geometry=new T.SphereGeometry(1.3,112,80);
        const position=geometry.attributes.position;
        for(let i=0;i<position.count;i++){
          const v=new T.Vector3().fromBufferAttribute(position,i),n=v.clone().normalize();
          const theta=Math.atan2(n.z,n.x);
          const shape=1+.15*Math.sin(theta*5+n.y*5)*Math.pow(1-n.y*n.y,.6)+.065*Math.cos(n.y*13);
          v.multiplyScalar(shape);
          v.y*=1.05;
          position.setXYZ(i,v.x,v.y,v.z);
        }
        geometry.computeVertexNormals();
        core=mesh(geometry,chrome);
        core.rotation.set(.15,.25,.25);
        const halo=mesh(new T.TorusGeometry(1.95,.075,18,130),red);
        halo.rotation.set(1.07,.22,-.5);
        const fine=mesh(new T.TorusGeometry(2.07,.007,6,130),new T.MeshBasicMaterial({color:0x393937,transparent:true,opacity:.35}));
        fine.rotation.copy(halo.rotation);
        for(let i=0;i<3;i++){
          const ball=mesh(new T.SphereGeometry(i===0?.22:.1,24,16),i===1?red:chrome);
          satellites.push(ball);
        }
      }else if(kind==="lens"){
        rotor=new T.Group();group.add(rotor);
        for(let i=0;i<5;i++){
          const ring=mesh(new T.TorusGeometry(1.06+i*.13,.048,14,100),i%2===0?chrome:dark,rotor);
          ring.position.z=(i-2)*.12;
        }
        mesh(new T.CylinderGeometry(1.2,1.2,.25,80,1,true),dark,rotor).rotation.x=Math.PI/2;
        const glass=mesh(new T.SphereGeometry(.95,56,36),new T.MeshPhysicalMaterial({color:0x1e9c87,metalness:.6,roughness:.12,clearcoat:1,transparent:true,opacity:.85}),rotor);
        glass.scale.z=.33;glass.position.z=.04;
        const pupil=mesh(new T.SphereGeometry(.4,32,20),dark,rotor);pupil.scale.z=.3;pupil.position.z=.37;
        for(let i=0;i<64;i++){
          const a=i/64*Math.PI*2;
          const fiber=mesh(new T.BoxGeometry(.008,.3,.005),new T.MeshBasicMaterial({color:i%3===0?0xb2f2d6:0x3caaa0,transparent:true,opacity:.75}),rotor);
          fiber.position.set(Math.cos(a)*.68,Math.sin(a)*.68,.31);fiber.rotation.z=a-Math.PI/2;
        }
        rotor.rotation.set(.1,-.36,-.2);
        const orbit=mesh(new T.TorusGeometry(1.8,.006,6,100),new T.MeshBasicMaterial({color:0xa2d7c7,transparent:true,opacity:.25}));orbit.rotation.set(.3,.1,0);
        const small=mesh(new T.SphereGeometry(.065,16,12),new T.MeshBasicMaterial({color:0xbff6d8}));small.position.set(-1.4,.8,0);
      }else if(kind==="signal"){
        const scanner=new T.Group();group.add(scanner);rotor=scanner;
        for(let i=0;i<4;i++){
          const frame=mesh(new T.BoxGeometry(2.8,1.8,.08),i===0?chrome:dark,scanner);
          const edges=new T.EdgesGeometry(frame.geometry);resources.push(edges);
          const lineMat=new T.LineBasicMaterial({color:0xffe4c8});resources.push(lineMat);
          frame.position.set(i*.15,i*-.1,-i*.48);
          const outline=new T.LineSegments(edges,lineMat);outline.position.copy(frame.position);scanner.add(outline);
          frame.material=new T.MeshStandardMaterial({color:0x111319,metalness:.85,roughness:.26,transparent:true,opacity:.5});resources.push(frame.material);
        }
        scanner.rotation.set(.15,-.42,.08);
        const positions=[];
        for(let i=0;i<320;i++){const u=i/320,a=u*Math.PI*24;positions.push((u-.5)*3,Math.sin(a)*.62,Math.cos(a)*.25+.25)}
        const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(positions,3));
        const mat=new T.PointsMaterial({color:0xf17e46,size:.032});resources.push(geo,mat);scanner.add(new T.Points(geo,mat));
      }else if(kind==="rhythm"){
        rotor=new T.Group();group.add(rotor);
        mesh(new T.TorusGeometry(1.2,.025,12,140),chrome,rotor);
        mesh(new T.TorusGeometry(.64,.015,8,100),red,rotor);
        for(let i=0;i<72;i++){
          const a=i/72*Math.PI*2,height=.16+Math.abs(Math.sin(a*5)+Math.cos(a*3))*.34;
          const bar=mesh(new T.BoxGeometry(.035,height,.13),i%6===0?red:chrome,rotor);
          bar.position.set(Math.cos(a)*1.2,Math.sin(a)*1.2,Math.sin(a*4)*.32);bar.rotation.z=a-Math.PI/2;
        }
        rotor.rotation.set(.25,-.38,-.24);
        const center=mesh(new T.SphereGeometry(.16,32,20),red,rotor);center.position.z=.15;
      }else{
        rotor=new T.Group();group.add(rotor);
        const panel=mesh(new T.BoxGeometry(2.6,1.65,.09),chrome,rotor);
        for(let x=0;x<7;x++)for(let y=0;y<4;y++){
          const cell=mesh(new T.BoxGeometry(.345,.365,.025),new T.MeshStandardMaterial({color:0x182f62,metalness:.8,roughness:.2}),rotor);
          cell.position.set((x-3)*.363,(y-1.5)*.39,.064);
          const bar=mesh(new T.BoxGeometry(.32,.008,.004),chrome,rotor);bar.position.set(cell.position.x,cell.position.y,.08);
        }
        const stand=mesh(new T.CylinderGeometry(.05,.08,1.3,20),chrome,rotor);stand.position.y=-1.3;
        const base=mesh(new T.CylinderGeometry(.45,.5,.08,48),dark,rotor);base.position.y=-1.95;
        rotor.rotation.set(-.4,-.25,-.12);rotor.position.y=.5;panel.position.z=0;
        const sun=mesh(new T.SphereGeometry(.28,32,20),new T.MeshStandardMaterial({color:0xffa64d,emissive:0xff9d43,emissiveIntensity:.8,roughness:.2}));
        sun.position.set(1.95,1.3,.4);satellites.push(sun);
      }
      let pointerX=0,pointerY=0,visible=false,frame=0,last=0;
      const reduced=matchMedia("(prefers-reduced-motion: reduce)");
      const resize=()=>{const b=el.getBoundingClientRect();if(!b.width||!b.height)return;renderer.setSize(b.width,b.height);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();renderer.render(scene,camera)};
      const ro=new ResizeObserver(resize);ro.observe(el);resize();
      const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting},{rootMargin:"100px"});io.observe(el);
      const move=(e:PointerEvent)=>{const b=el.getBoundingClientRect();pointerX=(e.clientX-b.left)/b.width-.5;pointerY=(e.clientY-b.top)/b.height-.5};
      const leave=()=>{pointerX=0;pointerY=0};
      el.addEventListener("pointermove",move);el.addEventListener("pointerleave",leave);
      const tick=(time:number)=>{
        frame=requestAnimationFrame(tick);if(!visible||document.hidden||time-last<32)return;last=time;
        const moving=!controls.current.paused&&!reduced.matches;
        if(moving){
          group.rotation.y+=(pointerX*.55-group.rotation.y)*.035;
          group.rotation.x+=(-pointerY*.3-group.rotation.x)*.035;
          group.position.y=Math.sin(time*.00065)*.08;
          if(core)core.rotation.y+=.004;
          if(rotor)rotor.rotation.z+=kind==="lens"?.0015:.0001;
          if(kind==="core")satellites.forEach((s,i)=>{const a=time*.00025+i*2.1;s.position.set(Math.cos(a)*1.9,Math.sin(a)*1.2,Math.sin(a)*.6)});
        }
        if(core)core.scale.setScalar(controls.current.alternate?.83:1);
        chrome.color.set(controls.current.alternate?0x0c0c0c:0xdde2ea);
        renderer.render(scene,camera);
      };
      frame=requestAnimationFrame(tick);
      setReady(true);
      const lost=()=>setUnavailable(true);renderer.domElement.addEventListener("webglcontextlost",lost);
      cleanup=()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();el.removeEventListener("pointermove",move);el.removeEventListener("pointerleave",leave);renderer.domElement.removeEventListener("webglcontextlost",lost);resources.forEach(r=>r.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()};
    }).catch(()=>setUnavailable(true));
    const activation=new IntersectionObserver(entries=>{if(!started&&entries.some(e=>e.isIntersecting)){started=true;activation.disconnect();void initialize()}},{rootMargin:"200px"});
    if(host.current)activation.observe(host.current);
    return()=>{cancelled=true;activation.disconnect();cleanup()};
  },[kind]);
  return <div className={"world-canvas world-"+kind} ref={host} role="img" aria-label={kind==="core"?"Interactive dark metallic sculpture with an orbiting red ring":kind==="rhythm"?"A rotating 3D waveform sculpture representing music":kind==="lens"?"3D optical lens, a concept visual for RetinaScan":kind==="signal"?"A rotating sculpture of layered electronic signals":"3D solar panel, a concept visual for the sun tracker"}>{!ready&&!unavailable&&<span className="world-loading">Loading 3D scene…</span>}{unavailable&&<div className="world-fallback"><span>3D preview unavailable</span><strong>{kind==="core"?"Interactive sculpture":kind==="rhythm"?"Code. Circuits. Sound.":kind==="lens"?"RetinaScan AI":kind==="signal"?"BorderVision AI":"Automatic Sun Tracker"}</strong></div>}</div>
}
