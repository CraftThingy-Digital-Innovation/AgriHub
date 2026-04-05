import React, { useEffect, useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const geoUrl = "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province-simple.json"; // GeoJSON API

interface MapData {
  prov_name: string;
  aggregate_price: number;
}

interface NationalPriceMapProps {
  data: MapData[];
  selectedProvince?: string;
  onProvinceClick?: (province: string) => void;
}

const colorScale = scaleLinear<string>()
  .domain([10000, 20000, 30000]) // Asumsi harga per komoditas: Hijau (Murah), Kuning (Sedang), Merah (Mahal)
  // Anda bisa mengganti logic warnanya sesuai rentang harga dinamis nantinya
  .range(["#4CAF50", "#FFC107", "#F44336"]);

// Normalizer nama provinsi antara Data BPS/BI dan GeoJSON
const normalizeProvName = (name: string) => {
  return name.toUpperCase()
    .replace('DKI ', '')
    .replace('DI ', '')
    .replace('KABUPATEN ', '')
    .replace('KOTA ', '');
};

const NationalPriceMap: React.FC<NationalPriceMapProps> = ({ data, selectedProvince, onProvinceClick }) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Map the prov name to their price
  const priceMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (data) {
        data.forEach(item => {
          map[normalizeProvName(item.prov_name)] = item.aggregate_price;
        });
    }
    return map;
  }, [data]);

  return (
    <div className="w-full bg-[#183a5e] rounded-xl overflow-hidden relative shadow-lg">
      <div className="p-4 bg-gradient-to-r from-[#183a5e] to-[#255280] text-white flex justify-between items-center shadow-md pb-6 relative z-10">
         <h2 className="text-xl font-bold font-heading flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Harga Pangan Antar Daerah
         </h2>
      </div>
      
      <div 
        className="relative w-full h-[400px]"
        onMouseMove={(e) => {
           // Track mouse for tooltip, offset slightly to not block cursor
           setTooltipPos({ x: e.clientX + 15, y: e.clientY - 20 });
        }}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 1200,
            center: [118, -2], // Center on Indonesia
          }}
          width={1000}
          height={400}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const mapProvName = normalizeProvName(geo.properties.state || geo.properties.Propinsi || "");
                  const currentPrice = priceMap[mapProvName];
                  
                  // Color formatting
                  let fillColor = "#D6EAF8"; // Default (No Data)
                  if (currentPrice) {
                      fillColor = colorScale(currentPrice) as string;
                  }

                  const isSelected = selectedProvince && selectedProvince.toUpperCase() === mapProvName.toUpperCase();

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke={isSelected ? "#FFF" : "#183a5e"}
                      strokeWidth={isSelected ? 1.5 : 0.5}
                      style={{
                        default: { outline: "none", zIndex: isSelected ? 10 : 1 },
                        hover: { fill: "#4fa7ff", opacity: 0.9, outline: "none", cursor: 'pointer', zIndex: 20 },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={() => {
                          setTooltipContent(`${mapProvName}: ${currentPrice ? 'Rp ' + currentPrice.toLocaleString('id-ID') : 'Tidak ada data'}`);
                      }}
                      onMouseLeave={() => {
                          setTooltipContent("");
                      }}
                      onClick={() => {
                          if (onProvinceClick) onProvinceClick(mapProvName);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Global Floating Tooltip */}
        {tooltipContent && (
           <div 
              style={{ top: tooltipPos.y, left: tooltipPos.x, position: 'fixed', zIndex: 9999, pointerEvents: 'none' }}
              className="bg-gray-900/90 text-white px-3 py-1.5 rounded-lg shadow-xl text-xs font-semibold whitespace-nowrap border border-white/20"
           >
              {tooltipContent}
           </div>
        )}
      </div>

      {/* Legend Map */}
      <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 text-white text-xs">
          <div className="mb-2 font-semibold">Tingkat Harga</div>
          <div className="flex gap-1 items-center">
             <div className="w-16 h-3 bg-[#4CAF50] rounded-sm"></div>
             <div>Rendah</div>
          </div>
          <div className="flex gap-1 items-center mt-1">
             <div className="w-16 h-3 bg-[#FFC107] rounded-sm"></div>
             <div>Sedang</div>
          </div>
          <div className="flex gap-1 items-center mt-1">
             <div className="w-16 h-3 bg-[#F44336] rounded-sm"></div>
             <div>Tinggi</div>
          </div>
      </div>
    </div>
  );
};

export default NationalPriceMap;
