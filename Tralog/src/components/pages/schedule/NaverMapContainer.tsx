// NaverMapContainer.tsx - 네이버 지도 컨테이너 컴포넌트
// 실제 지도 로직은 useNaverMap 훅에서 처리하고,
// 이 컴포넌트는 지도를 표시할 div와 API 키 오류 안내 UI만 담당합니다.

import { NAVER_MAP_CLIENT_ID } from "../../../config/api";
import { useNaverMap } from "./hooks/useNaverMap";

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
  centerLat: number;
  centerLng: number;
}

export default function NaverMapContainer({ places, centerLat, centerLng }: NaverMapContainerProps) {
  // useNaverMap 훅에서 mapRef를 받아서 div에 연결합니다
  const { mapRef } = useNaverMap({ places, centerLat, centerLng });

  return (
    <div className="box-white w-full h-full overflow-hidden relative">
      <div ref={mapRef} className="w-full h-full" />

      {/* API 키가 없을 때 보여주는 안내 오버레이 */}
      {!NAVER_MAP_CLIENT_ID && (
        <div className="absolute inset-0 bg-slate-100/50 flex flex-col items-center justify-center rounded-2xl">
          <div className="box-white px-5 py-4 text-center border border-slate-200 shadow-card">
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
