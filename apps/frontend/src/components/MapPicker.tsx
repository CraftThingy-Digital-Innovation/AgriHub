import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';

// Fix for default marker icon in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (data: {
    lat: number;
    lng: number;
    address: string;
    postalCode: string;
    kecamatan: string;
    areaId: string;
    city: string;
    province: string;
    kabupaten?: string;
  }) => void;
}

// Internal component to handle map clicks and fly-to
function MapEventsHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

export default function MapPicker({ initialLat, initialLng, onLocationSelect }: MapPickerProps) {
  const [pos, setPos] = useState<[number, number]>([initialLat || -6.200000, initialLng || 106.816666]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle position changes (click on map or search)
  const handlePositionChange = async (lat: number, lng: number) => {
    setPos([lat, lng]);
    setLoading(true);
    try {
      // 1. Reverse Geocode via Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`);
      const data = await res.json();
      
      if (data && data.address) {
        const address = data.display_name;
        const postalCode = data.address.postcode || '';
        const kecamatan = data.address.suburb || data.address.district || data.address.village || '';
        const city = data.address.city || data.address.town || data.address.city_district || '';
        const province = data.address.state || '';

        // 2. Search Area ID from Biteship (Backend Proxy)
        let areaId = '';
        try {
          const areaRes = await api.get(`/shipping/search-area?q=${city || kecamatan}`);
          if (areaRes.data.areas && areaRes.data.areas.length > 0) {
            areaId = areaRes.data.areas[0].id;
          }
        } catch (e) {
          console.error("Biteship Area Search Error:", e);
        }

        onLocationSelect({
          lat, lng, address, postalCode, kecamatan, areaId, city, province, kabupaten: city || data.address.county || ''
        });
      }
    } catch (err) {
      console.error("Geocoding Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search) return;
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(search)}&accept-language=id`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        handlePositionChange(parseFloat(lat), parseFloat(lon));
      }
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePositionChange(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLoading(false);
        console.error("Geolocation Error:", error);
        alert("Gagal mengambil lokasi. Pastikan izin akses lokasi diaktifkan.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Calculate floating component position based on props or defaulting
  return (
    <div className="relative h-[300px] w-full rounded-2xl overflow-hidden border-2 border-green-100 shadow-inner group">
      
      {/* Floating Search Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2">
        <button 
          className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md text-blue-600 hover:bg-blue-50 transition border border-transparent hover:border-blue-200" 
          onClick={(e) => { e.preventDefault(); handleMyLocation(); }} 
          disabled={loading}
          title="Lokasi Saat Ini"
        >
          <MapPin size={20} />
        </button>
        <div className="flex-1 flex bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-transparent focus-within:border-green-400 transition">
          <input 
            type="text" 
            className="w-full bg-transparent px-4 py-2 text-sm text-slate-700 focus:outline-none" 
            placeholder="Cari lokasi bangunan, kota, atau jalan..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            type="button"
            className="px-4 font-bold text-sm bg-green-600 text-white hover:bg-green-700 transition" 
            onClick={(e) => { e.preventDefault(); handleSearch(); }} 
            disabled={loading}
          >
            {loading ? '⏳' : 'CARI'}
          </button>
        </div>
      </div>

      <MapContainer center={pos} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={pos} />
        <MapEventsHandler onMapClick={handlePositionChange} />
        <ChangeView center={pos} />
      </MapContainer>

      {/* Floating Status / Tip Overlay */}
      <div className="absolute bottom-3 left-0 right-0 z-[1000] pointer-events-none flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-slate-900/70 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full font-medium">
          Klik manapun pada peta untuk memindahkan pin
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-[2000] flex flex-col items-center justify-center font-bold text-green-700 gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-green-200 border-t-green-600 animate-spin"></div>
          <span className="bg-white/80 px-3 py-1 rounded-full shadow-sm text-sm">Menyelaraskan koordinat satelit...</span>
        </div>
      )}
    </div>
  );
}
