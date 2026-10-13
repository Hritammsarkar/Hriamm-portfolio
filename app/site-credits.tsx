import {projectPhotos} from "./project-image";

export default function SiteCredits(){
  return <aside className="site-credits" id="credits" aria-label="Image and map credits">
    <details>
      <summary>Image & map credits<span aria-hidden="true">+</span></summary>
      <div className="credits-content">
        <p>Project photos are reference images. Thanks to the photographers and map creators below.</p>
        <ul>
          {Object.values(projectPhotos).map(photo=><li key={photo.src}><a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.caption.replace(" · reference photo","")}</a><span>{photo.author} · Wikimedia Commons · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener noreferrer">CC0</a></span></li>)}
          <li><a href="https://commons.wikimedia.org/wiki/File:West_Bengal_Wikivoyage_map.png" target="_blank" rel="noopener noreferrer">West Bengal map</a><span>NordNordWest & Sbb1413 · Wikimedia Commons · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a></span></li>
          <li><a href="https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg" target="_blank" rel="noopener noreferrer">Earth texture</a><span>Three.js examples</span></li>
          <li><a href="/images/hritamm-portrait.jpeg" target="_blank" rel="noopener noreferrer">Portrait</a><span>Personal photo provided by Hritamm Sarkar</span></li>
        </ul>
      </div>
    </details>
  </aside>;
}
