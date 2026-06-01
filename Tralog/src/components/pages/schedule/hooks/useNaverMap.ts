// useNaverMap.ts
import { useEffect, useRef, useCallback } from "react";
import { NAVER_MAP_CLIENT_ID } from "../../../../config/api";
import { type PlaceMarker } from "../NaverMapContainer";

// 네이버 지도 요소별 명확한 인터페이스 정의
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

interface UseNaverMapProps {
  places: PlaceMarker[];
  centerLat: number;
  centerLng: number;
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

export function useNaverMap({
  places,
  centerLat,
  centerLng,
}: UseNaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const polylinesRef = useRef<NaverPolyline[]>([]);
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
  const scriptLoadedRef = useRef(false);

  const renderMarkersAndLines = useCallback(() => {
    const naver = window.naver;
    if (!naver || !mapInstanceRef.current) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    if (infoWindowRef.current) infoWindowRef.current.close();

    const validPlaces = places.filter((p) => p.lat && p.lng);
    if (validPlaces.length === 0) return;

    const sortedPlaces = [...validPlaces].sort((a, b) => {
      const dayDiff = a.day_number - b.day_number;
      return dayDiff !== 0 ? dayDiff : a.visit_time.localeCompare(b.visit_time);
    });

    const dayCounts = new Map<number, number>();

    sortedPlaces.forEach((place) => {
      const position = new naver.maps.LatLng(place.lat!, place.lng!);
      const color = DAY_COLORS[(place.day_number - 1) % DAY_COLORS.length];
      const dayIndex = (dayCounts.get(place.day_number) ?? 0) + 1;
      dayCounts.set(place.day_number, dayIndex);

      const marker = new naver.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        icon: {
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
        },
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

    const uniqueDays = Array.from(
      new Set(sortedPlaces.map((p) => p.day_number)),
    );
    uniqueDays.forEach((day) => {
      const dayPlaces = sortedPlaces.filter((p) => p.day_number === day);
      if (dayPlaces.length < 2) return;

      const color = DAY_COLORS[(day - 1) % DAY_COLORS.length];
      const polyline = new naver.maps.Polyline({
        map: mapInstanceRef.current!,
        path: dayPlaces.map((p) => new naver.maps.LatLng(p.lat!, p.lng!)),
        strokeColor: color,
        strokeWeight: 3,
        strokeOpacity: 0.8,
        strokeStyle: "shortdash",
      });
      polylinesRef.current.push(polyline);
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

  return { mapRef };
}