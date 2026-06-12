// MapOverview.tsx - 대시보드 좌측 지도 + 달성률 카드
// 방문한 지역 수와 전체 대비 달성률 표시
// 지도/달성률 카드 클릭 시 나만의 지도 페이지로 이동

import { useState, useEffect } from "react";
import InteractiveMap from "../mymap/InteractiveMap";
import type { MapRecord } from "../mymap/MyMapPage";
import { API_BASE_URL } from "../../../config/api";

interface MapOverviewProps {
  userId: string;
  onNavigate: (page: string) => void;
}

interface HistorySchedule {
  id: string;
  region: string;
  status: string;
}

// 대한민국 광역시/도 총 17개
const TOTAL_REGIONS = 17;

export default function MapOverview({ userId, onNavigate }: MapOverviewProps) {
  const [mapRecords, setMapRecords] = useState<MapRecord[]>([]); // 지역별 지도 기록 목록
  const [visitedCount, setVisitedCount] = useState<number>(0); // 방문한 지역 수

  useEffect(() => {
    if (!userId) return;

    // 지도에 표시할 사진 기록 로드
    fetch(`${API_BASE_URL}/api/map/records/${userId}`)
      .then((res) => res.json())
      .then((data: MapRecord[]) => setMapRecords(data))
      .catch((err) => console.error("지도 기록 로드 오류:", err));

    // 방문 지역 수 계산 (중복 지역은 하나로 카운트)
    fetch(`${API_BASE_URL}/api/schedules/history/${userId}`)
      .then((res) => res.json())
      .then((data: HistorySchedule[]) => {
        const uniqueRegions = new Set(data.map((schedule) => schedule.region));
        setVisitedCount(uniqueRegions.size);
      })
      .catch((err) => console.error("히스토리 로드 오류:", err));
  }, [userId]);

  const achievementRate = Math.round((visitedCount / TOTAL_REGIONS) * 100);
  const remainingCount = TOTAL_REGIONS - visitedCount;

  return (
    <div className="flex flex-col gap-5 w-full h-full pl-1">
      {/* 지도 카드 - 클릭 시 나만의 지도 페이지로 이동 */}
      <div
        onClick={() => onNavigate("mymap")}
        className="card-map-theme flex-1 h-0"
      >
        <div className="w-full h-full flex flex-col items-center justify-center relative p-4">
          <div className="w-full h-full max-w-60 sm:max-w-70 lg:max-w-85 xl:max-w-100 2xl:max-w-115 max-h-[90%] flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-[1.01]">
            <InteractiveMap
              selectedRegion={null}
              onSelectRegion={() => {}}
              mapRecords={mapRecords}
              readOnly={true}
            />
          </div>
          <span className="box-white text-body-caption font-bold absolute bottom-4 px-4 py-2">
            🗺️ 지도를 눌러 추억 기록하기
          </span>
        </div>
      </div>

      {/* 달성률 카드 */}
      <div onClick={() => onNavigate("mymap")} className="card-achieve-theme">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex justify-between items-start shrink-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-body-caption">🗺️ 여행 목표</span>
              <h2>나만의 지도</h2>
              <span className="text-body-caption">대한민국 완전 정복</span>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-number-accent">{visitedCount}</span>
              <span className="text-body-caption">/ {TOTAL_REGIONS} 지역</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full mt-1">
            {/* 달성률 게이지 */}
            <div className="w-full h-2.5 rounded-full bg-white/45 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${achievementRate}%`,
                  background: "linear-gradient(to right, #fb923c, #ea580c)",
                }}
              />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <span className="text-body-caption">달성률</span>
              <span className="text-body-caption">{achievementRate}%</span>
            </div>
          </div>
        </div>

        <div className="box-ghost w-full py-2 px-4 flex items-center justify-center gap-1 shrink-0 mt-3">
          <div className="flex gap-1.5 items-center justify-center text-xs">
            {remainingCount > 0 ? (
              <>
                <span className="text-body-caption font-bold text-secondary">
                  🔥{remainingCount}개 지역
                </span>
                <span className="text-body-caption font-bold text-white">
                  만 더 가면 완성!
                </span>
              </>
            ) : (
              <span className="text-body-caption text-white">
                🎉 대한민국 정복 완료!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
