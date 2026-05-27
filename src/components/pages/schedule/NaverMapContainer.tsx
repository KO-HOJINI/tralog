// src/components/pages/schedule/NaverMapContainer.tsx
// 네이버 지도 API 연동 컴포넌트
// 사전 설정: index.html의 <head>에 아래 스크립트 태그를 추가해야 합니다.
// <script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_CLIENT_ID"></script>
// 또는 VITE_NAVER_MAP_CLIENT_ID 환경변수로 동적 로드 (아래 useEffect 참고)

import { useEffect, useRef, useCallback } from "react";
import { NAVER_MAP_CLIENT_ID } from "../../../config/api";

// 네이버 지도 타입 선언 (전역 window.naver 객체)
declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options: object) => NaverMap;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (options: object) => NaverMarker;
        InfoWindow: new (options: object) => NaverInfoWindow;
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

// 타입 별칭
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

// 일차별 마커 색상 (최대 5일차)
const DAY_COLORS = [
  "#0d9488", // teal (primary)
  "#f59e0b", // amber (secondary)
  "#6366f1", // indigo
  "#ec4899", // pink
  "#10b981", // emerald
];

export default function NaverMapContainer({
  places,
  centerLat = 37.5665,
  centerLng = 126.978,
}: NaverMapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
  const scriptLoadedRef = useRef(false);

  // ✅ 마커 렌더링 함수 (지도 초기화 후 places가 바뀔 때마다 재실행)
  const renderMarkers = useCallback(() => {
    const naver = window.naver;
    if (!naver || !mapInstanceRef.current) {
      console.warn("⚠️ 마커 렌더링 실패: naver 또는 mapInstance가 없음");
      return;
    }

    console.log("🗺️ 마커 렌더링 시작, 장소 개수:", places.length);

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (infoWindowRef.current) infoWindowRef.current.close();

    // 좌표가 있는 장소만 마커 표시
    const validPlaces = places.filter((p) => p.lat && p.lng);
    console.log("📍 유효한 좌표가 있는 장소:", validPlaces.length);

    if (validPlaces.length === 0) {
      console.warn("⚠️ 좌표가 있는 장소가 없습니다.");
      return;
    }

    validPlaces.forEach((place, idx) => {
      console.log(
        `📍 마커 ${idx + 1}: ${place.place_name} (${place.lat}, ${place.lng})`,
      );
      const position = new naver.maps.LatLng(place.lat!, place.lng!);
      const color = DAY_COLORS[(place.day_number - 1) % DAY_COLORS.length];

      // SVG 커스텀 마커 아이콘
      const markerIcon = {
        content: `
          <div style="
            display:flex; align-items:center; justify-content:center;
            width:28px; height:28px; border-radius:50%;
            background:${color}; color:white;
            font-size:11px; font-weight:900;
            border: 2.5px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            cursor:pointer;
            font-family: 'Noto Sans KR', sans-serif;
          ">${idx + 1}</div>`,
        anchor: new naver.maps.LatLng(14, 14),
      };

      const marker = new naver.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        icon: markerIcon,
        title: place.place_name,
      });

      // 클릭 시 InfoWindow (말풍선)
      const infoWindow = new naver.maps.InfoWindow({
        content: `
          <div style="
            padding: 8px 12px; border-radius: 10px;
            font-family: 'Noto Sans KR', sans-serif;
            font-size: 12px; font-weight: 700;
            color: #0f172a; white-space: nowrap;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
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
  }, [places]);

  // ✅ 네이버 지도 스크립트 동적 로드 및 초기화
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(centerLat, centerLng),
        zoom: 13,
        mapTypeId: window.naver.maps.MapTypeId.NORMAL,
      });

      renderMarkers();
    };

    // 이미 로드된 경우 바로 초기화
    if (window.naver?.maps) {
      initMap();
      return;
    }

    // 중복 로드 방지
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const clientId = NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      console.warn(
        "[NaverMap] VITE_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다.",
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = initMap;
    script.onerror = () =>
      console.error("[NaverMap] 스크립트 로드 실패. Client ID를 확인하세요.");
    document.head.appendChild(script);
  }, [centerLat, centerLng, renderMarkers]);

  // ✅ places가 바뀔 때 마커 갱신
  useEffect(() => {
    if (mapInstanceRef.current && window.naver?.maps) {
      renderMarkers();
    }
  }, [renderMarkers]);

  const hasApiKey = !!NAVER_MAP_CLIENT_ID;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative">
      {/* 실제 지도 컨테이너 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* API 키 미설정 시 안내 오버레이 */}
      {!hasApiKey && (
        <div className="absolute inset-0 bg-[#E2E8F0]/40 border border-slate-200/60 flex flex-col items-center justify-center rounded-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:16px_16px] opacity-60" />
          <div className="z-10 bg-pure-white px-5 py-3 rounded-2xl shadow-custom border border-slate-100 text-center select-none max-w-60">
            <span className="text-xs font-black text-dark tracking-wider block mb-1">
              🗺️ NAVER MAP
            </span>
            <span className="text-[10px] font-bold text-gray leading-relaxed">
              .env에 VITE_NAVER_MAP_CLIENT_ID를 설정하면 지도가 표시됩니다.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
