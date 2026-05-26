import InteractiveMap from "../mymap/InteractiveMap";
import type { MapRecord } from "../mymap/MyMapPage";

interface MapOverviewProps {
  userId: string;
  onNavigate: (page: string) => void;
}

export default function MapOverview({ userId, onNavigate }: MapOverviewProps) {
  const storedData = localStorage.getItem(`tralog_map_${userId}`);
  const mapRecords: MapRecord[] = storedData ? JSON.parse(storedData) : [];

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
        {/* 내부 컨테이너 패딩 조절 및 반응형 정렬 구조 변경 */}
        <div className="w-full h-full bg-white/10 backdrop-blur-xs flex flex-col items-center justify-center relative p-4">
          {/* 지도가 상하단으로 절대 잘리지 않도록 가로 세로 최대 높이를 균형있게 제한 */}
          <div className="w-full h-full max-w-[320px] max-h-[90%] flex items-center justify-center overflow-hidden">
            <InteractiveMap
              selectedRegion={null}
              onSelectRegion={() => {}}
              mapRecords={mapRecords}
              readOnly={true}
            />
          </div>

          {/* 하단 플로팅 라벨 */}
          <span className="absolute bottom-3 text-[11px] font-bold text-slate-700/80 bg-white/70 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm border border-white/40 group-hover:bg-primary group-hover:text-white transition-all">
            🗺️ 지도를 눌러 추억 기록하기
          </span>
        </div>
      </div>

      {/* 달성률 카드 (기존 테마 및 규격 유지) */}
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
