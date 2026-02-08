import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function MapView({ breed }) {
  const coords = [20.5937, 78.9629];
  return (
    <MapContainer center={coords} zoom={5} style={{ height: 300 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={coords} />
    </MapContainer>
  );
}
