export default function RegionMap(){
  return <div className="regional-map real-regional-map">
    <a className="static-regional-map" href="/images/west-bengal-map.png" target="_blank" rel="noopener noreferrer" aria-label="Open the detailed West Bengal map at full size">
      <img src="/images/west-bengal-map.png" width={2631} height={4013} alt="Detailed map of West Bengal showing Kolkata, Darjeeling, Siliguri, towns, rivers and neighbouring states and countries" decoding="async"/>
    </a>
    <a className="map-full-size" href="/images/west-bengal-map.png" target="_blank" rel="noopener noreferrer">View full map<span aria-hidden="true">↗</span></a>
  </div>;
}
