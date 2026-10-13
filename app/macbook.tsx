"use client";

import type {RefObject} from "react";
import "./macbook.css";

const pipeline = [
  ["Fundus input", "Retinal image"],
  ["Quality checks", "Preprocessing"],
  ["EfficientNet", "Severity prediction"],
  ["Grad-CAM", "Highlighted regions"],
];

export default function MacBook({stageRef}:{stageRef:RefObject<HTMLDivElement|null>}) {
  return <div className="laptop-stage macbook-stage" ref={stageRef}>
    <div className="macbook-ground" aria-hidden="true"/>
    <div className="macbook-deck" aria-hidden="true">
      <div className="macbook-speaker macbook-speaker-left"/>
      <div className="macbook-speaker macbook-speaker-right"/>
      <div className="macbook-keyboard">
        {Array.from({length:5},(_,row)=><div className={"macbook-key-row macbook-key-row-"+row} key={row}>
          {Array.from({length:row===4?7:14},(_,key)=><span key={key}/>) }
        </div>)}
      </div>
      <div className="macbook-trackpad"/>
    </div>
    <div className="macbook-lid">
      <div className="macbook-lid-back" aria-hidden="true"><span>MacBook Pro</span></div>
      <div className="macbook-lid-front">
        <div className="macbook-camera" aria-hidden="true"><span/></div>
        <div className="macbook-display">
          <div className="macbook-screen-bar"><span aria-hidden="true">● ● ●</span><span>RETINASCAN / SYSTEM ARCHITECTURE</span><span>01</span></div>
          <div className="macbook-screen-content">
            <div className="macbook-screen-side"><strong>r / ai</strong><span>Overview</span><span>Preprocessing</span><span>Inference</span><span>Explainability</span><small>IN DEVELOPMENT</small></div>
            <div className="macbook-screen-main">
              <span className="macbook-screen-label">EXPLAINABLE RETINAL SCREENING</span>
              <h3>From a scan<br/>to an explanation.</h3>
              <div className="macbook-pipeline">{pipeline.map(([name,description],i)=><div key={name}><small>0{i+1}</small><strong>{name}</strong><span>{description}</span></div>)}</div>
              <div className="macbook-screen-bottom"><span>PYTHON / PYTORCH / FASTAPI / POSTGRESQL</span><span>SYSTEM DESIGN</span></div>
            </div>
          </div>
        </div>
        <span className="macbook-engraving" aria-hidden="true">MacBook Pro</span>
      </div>
    </div>
    <div className="macbook-front-edge" aria-hidden="true"><span/></div>
  </div>;
}
