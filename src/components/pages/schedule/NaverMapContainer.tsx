// src/components/pages/schedule/NaverMapContainer.tsx
import { useEffect, useRef, useCallback } from "react";
import { NAVER_MAP_CLIENT_ID } from "../../../config/api";

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options: object) => NaverMap;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (options: object) => NaverMarker;
        InfoWindow: new (options: object) => NaverInfoWindow;
        Polyline: new (options: object) => NaverPolyline;
        Event: {
          addListener: (
            target: object,
            event: string,
            handler: () => void,
          ) => void;
        };
        MapTypeId: { NORMAL: string };
      };
    };
  }
}

interface NaverMap {
  setCenter: (latlng: NaverLatLng) => void;
}
interface NaverLatLng {
  lat(): number;
  lng(): number;
}
interface NaverMarker {
  setMap: (map: NaverMap | null) => void;
}
interface NaverInfoWindow {
  open: (map: NaverMap, marker: NaverMarker) => void;
  close: () => void;
}
interface NaverPolyline {
  setMap: (map: NaverMap | null) => void;
}

export interface PlaceMarker {
  id: string;
  place_name: string;
  lat?: number;
  lng?: number;
  day_number: number;
  visit_time: string;
}

interface NaverMapContainerProps {
  places: PlaceMarker[];
  centerLat?: number;
  centerLng?: number;
}

const DAY_COLORS = [
  "#0d9488",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
];

export default function NaverMapContainer({
  places,
  centerLat = 37.5665,
  centerLng = 126.978,
}: NaverMapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const polylinesRef = useRef<NaverPolyline[]>([]); // ✅ 여러 개의 선을 관리하도록 배열로 변경
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
  const scriptLoadedRef = useRef(false);

  const renderMarkersAndLines = useCallback(() => {
    const naver = window.naver;
    if (!naver || !mapInstanceRef.current) return;

    // 초기화
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    if (infoWindowRef.current) infoWindowRef.current.close();

    const validPlaces = places.filter((p) => p.lat && p.lng);
    if (validPlaces.length === 0) return;

    const sortedPlaces = [...validPlaces].sort((a, b) => {
      const dayDiff = a.day_number - b.day_number;
      if (dayDiff !== 0) return dayDiff;
      return a.visit_time.localeCompare(b.visit_time);
    });

    const dayCounts = new Map<number, number>();

    // 1. 마커 렌더링
    sortedPlaces.forEach((place) => {
      const position = new naver.maps.LatLng(place.lat!, place.lng!);
      const color = DAY_COLORS[(place.day_number - 1) % DAY_COLORS.length];
      const dayIndex = (dayCounts.get(place.day_number) ?? 0) + 1;
      dayCounts.set(place.day_number, dayIndex);
      const markerIcon = {
        content: `
          <div style="
            display:flex; align-items:center; justify-content:center;
            width:26px; height:26px; border-radius:50%;
            background:${color}; color:white;
            font-size:12px; font-weight:bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor:pointer;
          ">${dayIndex}</div>`,
        anchor: new naver.maps.LatLng(13, 13),
      };

      const marker = new naver.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        icon: markerIcon,
        title: place.place_name,
      });

      const infoWindow = new naver.maps.InfoWindow({
        content: `
          <div style="
            padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: bold;
            color: #333; background: white; box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          ">
            <span style="color:${color}; margin-right:4px;">${place.day_number}일차</span>
            ${place.visit_time} · ${place.place_name}
          </div>`,
        borderWidth: 0,
        backgroundColor: "transparent",
        disableAnchor: true,
      });

      naver.maps.Event.addListener(marker, "click", () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        infoWindow.open(mapInstanceRef.current!, marker);
        infoWindowRef.current = infoWindow;
      });

      markersRef.current.push(marker);
    });

    // 2. 날짜별로 분리해서 선(Polyline) 렌더링 (이전 날짜와 이어지지 않음)
    const uniqueDays = Array.from(
      new Set(sortedPlaces.map((p) => p.day_number)),
    );

    uniqueDays.forEach((day) => {
      const dayPlaces = sortedPlaces.filter((p) => p.day_number === day);
      if (dayPlaces.length > 1) {
        const polylinePath = dayPlaces.map(
          (p) => new naver.maps.LatLng(p.lat!, p.lng!),
        );
        const color = DAY_COLORS[(day - 1) % DAY_COLORS.length];

        const polyline = new naver.maps.Polyline({
          map: mapInstanceRef.current!,
          path: polylinePath,
          strokeColor: color,
          strokeWeight: 3,
          strokeOpacity: 0.8,
          strokeStyle: "shortdash",
        });
        polylinesRef.current.push(polyline);
      }
    });
  }, [places]);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(centerLat, centerLng),
        zoom: 12,
        mapTypeId: window.naver.maps.MapTypeId.NORMAL,
      });
      renderMarkersAndLines();
    };
    if (window.naver?.maps) {
      initMap();
      return;
    }
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    if (!NAVER_MAP_CLIENT_ID) return;

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }, [centerLat, centerLng, renderMarkersAndLines]);

  useEffect(() => {
    if (mapInstanceRef.current && window.naver?.maps) {
      renderMarkersAndLines();
    }
  }, [renderMarkersAndLines]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative">
      <div ref={mapRef} className="w-full h-full" />
      {!NAVER_MAP_CLIENT_ID && (
        <div className="absolute inset-0 bg-slate-100/50 flex flex-col items-center justify-center rounded-2xl">
          <div className="bg-white px-5 py-4 rounded-xl shadow-sm text-center border border-slate-200">
            <span className="text-sm font-bold text-slate-700">
              지도를 불러올 수 없습니다 🗺️
            </span>
            <p className="text-xs text-slate-500 mt-1">
              .env 파일에 API 키를 설정해주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
