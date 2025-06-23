"use client";

import { useState, useRef, useCallback } from "react";
import { SafeZone, MapPosition } from "@/lib/types/safezone";
import { Plus } from "lucide-react";

interface SimpleMapProps {
  safeZones: SafeZone[];
  onMarkerClick?: (safeZone: SafeZone) => void;
  onMapClick?: (position: MapPosition) => void;
  selectedSafeZone?: SafeZone | null;
  showAddMode?: boolean;
  center?: MapPosition;
  zoom?: number;
}

export function SimpleMap({
  safeZones,
  onMarkerClick,
  onMapClick,
  selectedSafeZone,
  showAddMode = false,
  center = { lat: 37.5665, lng: 126.9780 }, // 서울 시청 기본 좌표
  zoom = 1
}: SimpleMapProps) {
  const mapRef = useRef<SVGSVGElement>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // 위도/경도를 SVG 좌표계로 변환
  const latLngToSVG = useCallback((lat: number, lng: number) => {
    const mapWidth = 800;
    const mapHeight = 600;
    
    // 간단한 메르카토르 투영법 시뮬레이션
    const x = ((lng - mapCenter.lng) * mapZoom * 10) + mapWidth / 2;
    const y = ((mapCenter.lat - lat) * mapZoom * 10) + mapHeight / 2;
    
    return { x, y };
  }, [mapCenter, mapZoom]);

  // SVG 좌표를 위도/경도로 변환
  const svgToLatLng = useCallback((x: number, y: number): MapPosition => {
    const mapWidth = 800;
    const mapHeight = 600;
    
    const lng = mapCenter.lng + (x - mapWidth / 2) / (mapZoom * 10);
    const lat = mapCenter.lat - (y - mapHeight / 2) / (mapZoom * 10);
    
    return { lat, lng };
  }, [mapCenter, mapZoom]);

  const handleMapClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!onMapClick || !showAddMode) return;
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const position = svgToLatLng(x, y);
    onMapClick(position);
  };

  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    const panAmount = 0.01 / mapZoom;
    setMapCenter(prev => {
      switch (direction) {
        case 'up':
          return { ...prev, lat: prev.lat + panAmount };
        case 'down':
          return { ...prev, lat: prev.lat - panAmount };
        case 'left':
          return { ...prev, lng: prev.lng - panAmount };
        case 'right':
          return { ...prev, lng: prev.lng + panAmount };
        default:
          return prev;
      }
    });
  };

  return (
    <div className="relative border rounded-lg overflow-hidden bg-slate-50">
      {/* 지도 컨트롤 */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-2 space-y-2">
        <button
          onClick={handleZoomIn}
          className="block w-8 h-8 bg-white border rounded text-sm hover:bg-gray-50"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="block w-8 h-8 bg-white border rounded text-sm hover:bg-gray-50"
        >
          -
        </button>
      </div>

      {/* 방향 컨트롤 */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-1">
        <div className="grid grid-cols-3 gap-1">
          <div></div>
          <button
            onClick={() => handlePan('up')}
            className="w-6 h-6 bg-white border rounded text-xs hover:bg-gray-50"
          >
            ↑
          </button>
          <div></div>
          <button
            onClick={() => handlePan('left')}
            className="w-6 h-6 bg-white border rounded text-xs hover:bg-gray-50"
          >
            ←
          </button>
          <div></div>
          <button
            onClick={() => handlePan('right')}
            className="w-6 h-6 bg-white border rounded text-xs hover:bg-gray-50"
          >
            →
          </button>
          <div></div>
          <button
            onClick={() => handlePan('down')}
            className="w-6 h-6 bg-white border rounded text-xs hover:bg-gray-50"
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>

      {showAddMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm">
          <Plus className="inline w-4 h-4 mr-1" />
          지도를 클릭하여 세이프 존을 추가하세요
        </div>
      )}

      {/* SVG 지도 */}
      <svg
        ref={mapRef}
        width="100%"
        height="600"
        viewBox="0 0 800 600"
        className="cursor-crosshair"
        onClick={handleMapClick}
      >
        {/* 배경 그리드 */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* 중심점 표시 */}
        <circle
          cx={400}
          cy={300}
          r="3"
          fill="#6b7280"
          stroke="#374151"
          strokeWidth="1"
        />
        
        {/* 세이프 존 마커들 */}
        {safeZones.map((safeZone) => {
          if (!safeZone.lat || !safeZone.lng) return null;
          
          const { x, y } = latLngToSVG(safeZone.lat, safeZone.lng);
          const isSelected = selectedSafeZone?.id === safeZone.id;
          
          return (
            <g key={safeZone.id}>
              {/* 마커 */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? "12" : "8"}
                fill={isSelected ? "#dc2626" : "#059669"}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkerClick?.(safeZone);
                }}
              />
              
              {/* 마커 아이콘 */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white text-xs font-bold pointer-events-none"
              >
                S
              </text>
              
              {/* 툴팁 (선택된 마커) */}
              {isSelected && (
                <g>
                  <rect
                    x={x + 15}
                    y={y - 25}
                    width="120"
                    height="40"
                    fill="white"
                    stroke="#d1d5db"
                    strokeWidth="1"
                    rx="4"
                    className="drop-shadow-md"
                  />
                  <text
                    x={x + 20}
                    y={y - 10}
                    className="fill-gray-900 text-xs font-medium"
                  >
                    {safeZone.building_name || '세이프 존'}
                  </text>
                  <text
                    x={x + 20}
                    y={y + 5}
                    className="fill-gray-600 text-xs"
                  >
                    {safeZone.address || '주소 없음'}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* 하단 정보 */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 text-sm text-gray-600">
        중심: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)} | 줌: {mapZoom.toFixed(1)}x
      </div>
      
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 text-sm text-gray-600">
        세이프 존: {safeZones.filter(sz => sz.lat && sz.lng).length}개
      </div>
    </div>
  );
}