"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { SafeZone, MapPosition } from "@/lib/types/safezone";
import { Plus, Loader2 } from "lucide-react";

interface GoogleMapProps {
  safeZones: SafeZone[];
  onMarkerClick?: (safeZone: SafeZone) => void;
  onMapClick?: (position: MapPosition) => void;
  selectedSafeZone?: SafeZone | null;
  showAddMode?: boolean;
  center?: MapPosition;
  zoom?: number;
}

export function GoogleMap({
  safeZones,
  onMarkerClick,
  onMapClick,
  selectedSafeZone,
  showAddMode = false,
  center = { lat: 37.5665, lng: 126.9780 }, // 서울 시청
  zoom = 11
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Google Maps 로드
  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        setError('Google Maps API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
        return;
      }

      try {
        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["maps", "marker"]
        });

        await loader.load();
        setIsLoaded(true);
      } catch (err) {
        console.error('Google Maps 로드 실패:', err);
        setError('Google Maps를 로드할 수 없습니다.');
      }
    };

    initMap();
  }, []);

  // 맵 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
      disableDefaultUI: false,
      clickableIcons: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    // 맵 클릭 이벤트
    newMap.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (onMapClick && showAddMode && event.latLng) {
        const position = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        onMapClick(position);
      }
    });

    setMap(newMap);
  }, [isLoaded, center, zoom, onMapClick, showAddMode, map]);

  // 마커 생성/업데이트
  const createMarker = useCallback((safeZone: SafeZone) => {
    if (!map || !safeZone.lat || !safeZone.lng) return null;

    const isSelected = selectedSafeZone?.id === safeZone.id;
    
    const marker = new google.maps.Marker({
      position: { lat: safeZone.lat, lng: safeZone.lng },
      map,
      title: safeZone.building_name || '세이프 존',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 12 : 8,
        fillColor: isSelected ? '#dc2626' : '#059669',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: isSelected ? 1000 : 1
    });

    // 마커 클릭 이벤트
    marker.addListener("click", () => {
      onMarkerClick?.(safeZone);
    });

    // 선택된 마커에 정보창 표시
    if (isSelected) {
      if (!infoWindowRef.current) {
        infoWindowRef.current = new google.maps.InfoWindow();
      }
      
      const content = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
            ${safeZone.building_name || '세이프 존'}
          </h3>
          ${safeZone.address ? `<p style="margin: 4px 0; color: #666; font-size: 14px;">📍 ${safeZone.address}</p>` : ''}
          ${safeZone.contact ? `<p style="margin: 4px 0; color: #666; font-size: 14px;">📞 ${safeZone.contact}</p>` : ''}
          ${safeZone.level ? `<p style="margin: 4px 0; color: #666; font-size: 14px;">⭐ 레벨: ${safeZone.level}</p>` : ''}
          <p style="margin: 4px 0; color: #999; font-size: 12px;">
            좌표: ${safeZone.lat.toFixed(6)}, ${safeZone.lng.toFixed(6)}
          </p>
        </div>
      `;
      
      infoWindowRef.current.setContent(content);
      infoWindowRef.current.open(map, marker);
    }

    return marker;
  }, [map, selectedSafeZone, onMarkerClick]);

  // 마커들 업데이트
  useEffect(() => {
    if (!map) return;

    // 기존 마커들 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current.clear();

    // 새 마커들 생성
    safeZones.forEach(safeZone => {
      const marker = createMarker(safeZone);
      if (marker) {
        markersRef.current.set(safeZone.id, marker);
      }
    });

    // 선택된 마커가 없으면 정보창 닫기
    if (!selectedSafeZone && infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  }, [map, safeZones, createMarker, selectedSafeZone]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      const markers = markersRef.current;
      markers.forEach(marker => marker.setMap(null));
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 mb-2">❌ 지도 로드 오류</div>
          <div className="text-sm text-gray-600">{error}</div>
          <div className="text-xs text-gray-500 mt-2">
            Google Cloud Console에서 API 키를 발급받고<br />
            .env.local 파일에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 설정해주세요.
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <div className="text-gray-600">Google Maps 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showAddMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm shadow-md">
          <Plus className="inline w-4 h-4 mr-1" />
          지도를 클릭하여 세이프 존을 추가하세요
        </div>
      )}
      
      {/* 지도 정보 */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 text-sm text-gray-600 z-10">
        세이프 존: {safeZones.filter(sz => sz.lat && sz.lng).length}개
      </div>

      {/* Google Maps 컨테이너 */}
      <div 
        ref={mapRef} 
        className="w-full h-[600px] rounded-lg"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
}