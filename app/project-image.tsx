import type {Project} from "./content";

export const projectPhotos:Record<string,{src:string;alt:string;caption:string;author:string;source:string}>={
  retinascan:{src:"/images/projects/fundus.jpg",alt:"Real fundus photograph of a right eye, showing the retina, optic disc and blood vessels",caption:"Fundus photograph",author:"Mikael Häggström",source:"https://commons.wikimedia.org/wiki/File:Fundus_photograph_of_normal_right_eye.jpg"},
  bordervision:{src:"/images/projects/surveillance-camera.jpg",alt:"Photograph of an outdoor surveillance camera",caption:"Surveillance camera · reference photo",author:"Neslihan_Turan",source:"https://commons.wikimedia.org/wiki/File:Surveillance_camera.jpg"},
  suntracker:{src:"/images/projects/solar-tracker.jpg",alt:"Photograph of solar panels mounted on a dual-axis solar tracker",caption:"Solar tracker · reference photo",author:"Wikideas1",source:"https://commons.wikimedia.org/wiki/File:Solar_tracker.jpg"},
};

export default function ProjectImage({project,eager=false}:{project:Project;eager?:boolean}){
  const photo=projectPhotos[project.id];
  if(!photo)return <figure className="project-photo photo-fallback">
    <span className="label">PROJECT PHOTO</span>
    <strong>{project.name}</strong>
    <p>A photo hasn’t been added yet.</p>
  </figure>;
  return <figure className={"project-photo photo-"+project.id}>
    <img src={photo.src} alt={photo.alt} loading={eager?"eager":"lazy"} decoding="async"/>
  </figure>;
}
