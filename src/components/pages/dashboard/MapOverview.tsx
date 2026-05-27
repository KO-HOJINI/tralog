// src/components/pages/dashboard/MapOverview.tsx
import { useState, useEffect } from "react";
import InteractiveMap from "../mymap/InteractiveMap";
import type { MapRecord } from "../mymap/MyMapPage";
import { API_BASE_URL } from "../../../config/api";

interface MapOverviewProps {
  userId: string;
  onNavigate: (page: string) => void;
}

export default function MapOverview({ userId, onNavigate }: MapOverviewProps) {
  // ✅ Fix: localStorage 대신 DB에서 mapRecords를 fetch
  const [mapRecords, setMapRecords] = useState<MapRecord[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE_URL}/api/map/records/${userId}`)
      .then((res) => res.json())
      .then((data: MapRecord[]) => setMapRecords(data))
      .catch((err) => console.error("지도 기록 로드 오류:", err));
  }, [userId]);

  const visitedCount = mapRecords.filter(
    (r) => r.images && r.images.length > 0,
  ).length;

  const achievementRate = Math.round((visitedCount / 17) * 100);
  const remainingCount = 17 - visitedCount;

  return (
    <div className="flex flex-col gap-5 w-full h-full">
      {/* 지도 섹션 */}
      <div
        onClick={() => onNavigate("mymap")}
        className="box-custom flex-1 h-0 w-full card-map-theme relative group cursor-pointer overflow-hidden flex items-center justify-center p-0"
      >
        <div className="w-full h-full bg-white/10 backdrop-blur-xs flex flex-col items-center justify-center relative p-4">
          <div className="w-full h-full max-w-[320px] max-h-[90%] flex items-center justify-center overflow-hidden">
            {/* ✅ DB에서 받아온 mapRecords 전달 → 커버이미지 반영됨 */}
            <InteractiveMap
              selectedRegion={null}
              onSelectRegion={() => {}}
              mapRecords={mapRecords}
              readOnly={true}
            />
          </div>

          <span className="absolute bottom-3 text-[11px] font-bold text-slate-700/80 bg-white/70 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm border border-white/40 group-hover:bg-primary group-hover:text-white transition-all">
            🗺️ 지도를 눌러 추억 기록하기
          </span>
        </div>
      </div>

      {/* 달성률 카드 */}
      <div
        onClick={() => onNavigate("mymap")}
        className="box-custom h-fit w-full card-achieve-theme cursor-pointer hover:scale-[1.01] transition-transform"
      >
        <div className="flex flex-col gap-3 w-full">
          <div className="flex justify-between items-start shrink-0">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800/80">
                <span>🗺️ 여행 목표</span>
              </div>
              <h1 className="text-base font-bold my-0 leading-tight">
                나만의 지도
              </h1>
              <span className="text-xs text-slate-800/90 font-medium">
                대한민국 완전 정복
              </span>
            </div>

            <div className="text-right flex flex-col items-end leading-none">
              <span className="text-number-accent text-xl font-bold">
                {visitedCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                / 17 지역
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full mt-1">
            <div className="w-full bg-slate-100 rounded-full h-2.5 p-0.5 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out bg-gray"
                style={{ width: `${achievementRate}%` }}
              />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <span className="text-[10px] font-bold text-slate-500">
                달성률
              </span>
              <span className="text-[11px] font-extrabold text-primary">
                {achievementRate}%
              </span>
            </div>
          </div>
        </div>

        <div className="box-custom w-full bg-gray py-2 px-4 flex items-center justify-center gap-1 shrink-0 mt-3">
          <div className="flex gap-1.5 items-center justify-center text-xs">
            {remainingCount > 0 ? (
              <>
                <span className="text-white opacity-90">🔥</span>
                <span className="text-secondary font-bold">
                  {remainingCount}개 지역
                </span>
                <span className="text-white opacity-90">만 더 가면 완성!</span>
              </>
            ) : (
              <span className="text-white font-bold">
                🎉 대한민국 정복 완료!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
