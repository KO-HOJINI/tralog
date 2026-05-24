// MapOverview.tsx
interface MapOverviewProps {
  userId: string;
  onNavigate: (page: string) => void;
}

interface MapRecord {
  region: string;
  images: string[];
}

export default function MapOverview({ userId, onNavigate }: MapOverviewProps) {
  const storedMap = localStorage.getItem(`tralog_map_${userId}`);

  const { visitedCount, achievementRate } = (() => {
    if (storedMap) {
      const records = JSON.parse(storedMap) as MapRecord[];
      const activeRegions = records.filter(
        (r) => r.images && r.images.length > 0,
      ).length;
      return {
        visitedCount: activeRegions,
        achievementRate: Math.round((activeRegions / 17) * 100),
      };
    }
    const defaultCount = userId === "admin" ? 6 : 0;
    return {
      visitedCount: defaultCount,
      achievementRate: Math.round((defaultCount / 17) * 100),
    };
  })();

  const remainingCount = 17 - visitedCount;

  return (
    <div className="flex flex-col gap-5 w-full h-full">
      {/* 지도 */}
      <div
        onClick={() => onNavigate("mymap")}
        className="box-custom flex-1 h-0 w-full card-map-theme relative group"
      >
        <div className="w-full max-w-80 h-[95%] bg-white/20 backdrop-blur-xs rounded-4xl border border-white/30 p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-44 h-[80%] border border-dashed border-slate-700/20 rounded-full flex flex-col items-center justify-center bg-white/10 shadow-inner">
            <span className="text-xs text-slate-800 font-extrabold tracking-widest opacity-40 text-center px-2 select-none">
              KOREA MAP FRAME
            </span>
            <span className="text-[11px] text-slate-700 font-medium opacity-30 mt-1 text-center px-4 leading-tight select-none">
              여기에 완성된 지도가
              <br />
              렌더링됩니다
            </span>
          </div>
          <span className="absolute bottom-3 text-[11px] font-semibold text-slate-700/60 bg-white/40 px-3 py-1 rounded-full backdrop-blur-xs whitespace-nowrap select-none">
            🗺️ 지도를 눌러 지역별 추억 기록하기
          </span>
        </div>
      </div>

      {/* 💛 [카드 2] 달성률 대형 카드 */}
      <div
        onClick={() => onNavigate("mymap")}
        className="box-custom h-fit w-full card-achieve-theme"
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
              {/* 🛠️ text-number-accent 활용 */}
              <span className="text-number-accent text-xl">{visitedCount}</span>
              <span className="text-number-accent text-[11px] text-slate-950/50 mt-0.5">
                / 17 지역
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full mt-1">
            <div className="w-full bg-white rounded-full h-2.5 p-0.5 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gray"
                style={{ width: `${achievementRate}%` }}
              />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <span className="text-[10px] font-bold text-dark opacity-85">
                달성률
              </span>
              <span className="text-[11px] font-bold text-dark">
                {achievementRate}%
              </span>
            </div>
          </div>
        </div>

        {/* 하단 안내 배너 */}
        <div className="box-custom w-full bg-gray py-2 px-4 flex items-center justify-center gap-1 shrink-0 hide-on-short-screen mt-1">
          <div className="flex gap-1.5 items-center justify-center text-center w-full select-none text-xs">
            {remainingCount > 0 ? (
              <>
                <span>🔥</span>
                <h3 className="text-secondary font-bold m-0 text-xs inline">
                  {remainingCount}개 지역
                </h3>
                <h3 className="text-white font-bold m-0 text-xs inline">
                  만 더 가면 완성!
                </h3>
              </>
            ) : (
              <h3 className="text-white font-bold m-0 text-xs text-center">
                🎉 대한민국 정복 완료!
              </h3>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
