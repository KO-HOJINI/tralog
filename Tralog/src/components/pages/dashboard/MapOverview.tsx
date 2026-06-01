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

const TOTAL_REGIONS = 17;

export default function MapOverview({ userId, onNavigate }: MapOverviewProps) {
  const [mapRecords, setMapRecords] = useState<MapRecord[]>([]);
  const [visitedCount, setVisitedCount] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;

    fetch(`${API_BASE_URL}/api/map/records/${userId}`)
      .then((res) => res.json())
      .then((data: MapRecord[]) => setMapRecords(data))
      .catch((err) => console.error("지도 기록 로드 오류:", err));

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
    <div className="flex flex-col gap-5 w-full h-full">
      {/* 지도 카드 - 클릭하면 나만의 지도 페이지로 이동 */}
      <div
        onClick={() => onNavigate("mymap")}
        className="card-map-theme flex-1 h-0 w-full relative group overflow-hidden p-0"
      >
        <div className="w-full h-full flex flex-col items-center justify-center relative p-4">
          {/* 지도 컴포넌트 컨테이너 */}
          <div className="w-full h-full max-w-[320px] max-h-[90%] flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
            <InteractiveMap
              selectedRegion={null}
              onSelectRegion={() => {}}
              mapRecords={mapRecords}
              readOnly={true}
            />
          </div>

          {/* 💡 하단 배너 */}
          <span className="absolute bottom-4 text-[11px] font-extrabold text-slate-600 tracking-tight bg-white/80 px-4 py-2 rounded-full border border-slate-200/50 shadow-xs backdrop-blur-sm group-hover:bg-[#4f5b70] group-hover:text-pure-white group-hover:border-[#4f5b70] transition-all duration-300">
            🗺️ 지도를 눌러 추억 기록하기
          </span>
        </div>
      </div>

      <div
        onClick={() => onNavigate("mymap")}
        className="box-ghost h-fit w-full card-achieve-theme cursor-pointer hover:scale-[1.01] transition-transform"
      >
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
            <div className="w-full bg-slate-100 rounded-full h-2.5 p-0.5 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out bg-gray"
                style={{ width: `${achievementRate}%` }}
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
