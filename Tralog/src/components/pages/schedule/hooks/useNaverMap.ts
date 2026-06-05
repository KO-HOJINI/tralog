// useNaverMap.ts - 네이버 지도 커스텀 훅
// 네이버 Maps API 스크립트를 동적으로 로드하고,
// 장소 마커와 일차별 이동 경로(폴리라인)를 지도 위에 그립니다.
//
// ※ 이 파일 전체를 AI 도움을 받아 구현했습니다.
// 네이버 지도 SDK는 window.naver.maps 네임스페이스를 사용하는데,
// TypeScript에서 전역 타입 선언(declare global)을 하는 방법,
// 스크립트 동적 로드 후 콜백으로 지도를 초기화하는 방법,
// useRef로 지도/마커 인스턴스를 관리하는 방법 등을 AI 도움으로 작성했습니다.

import { useEffect, useRef, useCallback } from "react";
import { NAVER_MAP_CLIENT_ID } from "../../../../config/api";
import { type PlaceMarker } from "../NaverMapContainer";

// 네이버 지도 SDK 타입들을 TypeScript에서 쓸 수 있도록 선언합니다
// ※ AI 도움을 받아 작성한 타입 선언입니다
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

// window 전역 객체에 naver 속성을 추가합니다 (SDK 로드 후 생성됨)
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
          addListener: (target: object, event: string, handler: () => void) => void;
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

// 일차별로 다른 색상을 사용합니다 (1일차=teal, 2일차=amber, ...)
const DAY_COLORS = ["#0d9488", "#f59e0b", "#6366f1", "#ec4899", "#10b981", "#8b5cf6", "#ef4444"];

export function useNaverMap({ places, centerLat, centerLng }: UseNaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const polylinesRef = useRef<NaverPolyline[]>([]);
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
  const scriptLoadedRef = useRef(false);

  // ※ AI 도움을 받아 구현했습니다
  // 기존 마커/폴리라인을 모두 지우고 장소 목록을 다시 그립니다.
  // useCallback으로 감싸서 places가 바뀔 때만 함수를 새로 만들도록 했습니다.
  const renderMarkersAndLines = useCallback(() => {
    const naver = window.naver;
    if (!naver || !mapInstanceRef.current) return;

    // 기존 마커와 폴리라인 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    if (infoWindowRef.current) infoWindowRef.current.close();

    // 좌표가 있는 장소만 필터링해서 시간 순으로 정렬
    const validPlaces = places.filter((p) => p.lat && p.lng);
    if (validPlaces.length === 0) return;

    const sortedPlaces = [...validPlaces].sort((a, b) => {
      const dayDiff = a.day_number - b.day_number;
      return dayDiff !== 0 ? dayDiff : a.visit_time.localeCompare(b.visit_time);
    });

    const dayCounts = new Map<number, number>();

    // 각 장소에 번호 마커 생성 (일차별로 색상 구분)
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

      // 마커 클릭 시 장소 이름과 방문 시간을 보여주는 인포윈도우
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

    // 같은 일차의 장소들을 선으로 연결합니다 (이동 경로 표시)
    const uniqueDays = Array.from(new Set(sortedPlaces.map((p) => p.day_number)));
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

  // ※ AI 도움을 받아 구현했습니다
  // 네이버 지도 SDK 스크립트를 <head>에 동적으로 추가하고, 로드 완료 시 지도를 초기화합니다.
  // 이미 로드된 경우에는 바로 초기화합니다.
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

    // 이미 SDK가 로드돼 있으면 바로 초기화
    if (window.naver?.maps) {
      initMap();
      return;
    }
    if (scriptLoadedRef.current) return;

    scriptLoadedRef.current = true;
    if (!NAVER_MAP_CLIENT_ID) return;

    // SDK 스크립트 태그를 동적으로 생성해서 추가합니다
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }, [centerLat, centerLng, renderMarkersAndLines]);

  // 장소 목록이 바뀌면 마커를 다시 그립니다
  useEffect(() => {
    if (mapInstanceRef.current && window.naver?.maps) {
      renderMarkersAndLines();
    }
  }, [renderMarkersAndLines]);

  return { mapRef };
}
