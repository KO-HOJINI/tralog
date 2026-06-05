// MyMapHistory.tsx - 나만의 지도 우측 히스토리 목록
// 완료된 여행 기록과 사진이 있는 진행 중 일정을 목록으로 보여줍니다.
// 일정 없이 방문한 지역을 직접 선택해서 사진을 추가하는 기능도 있습니다.
// 데이터 로직은 useMapHistory 훅으로 분리했습니다.

import { useMapHistory, parseLocalDate } from "./hooks/useMapHistory";

interface MyMapHistoryProps {
  onSelectRegion: (region: string) => void;
  onNavigate: (page: string, scheduleId?: string) => void;
}

const REGION_OPTIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "경기도", "강원특별자치도", "충청북도", "충청남도",
  "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

export default function MyMapHistory({ onSelectRegion, onNavigate }: MyMapHistoryProps) {
  const {
    historyList,
    isLoading,
    isAddingSection,
    setIsAddingSection,
    selectedNewRegion,
    setSelectedNewRegion,
    deletingId,
    handleViewSchedule,
    handleDeleteSchedule,
    handleDirectRegionSubmit,
  } = useMapHistory(onNavigate, onSelectRegion);

  return (
    <div className="flex-col-full gap-4">
      <div className="flex flex-col gap-0.5 px-1 shrink-0 select-none">
        <h2>나의 여행 기록 히스토리</h2>
        <p className="text-body-caption text-slate-400">
          완료된 여행의 소중한 순간과 발자취를 확인하세요
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar pr-1 flex flex-col gap-3">
        {!isAddingSection ? (
          <div
            onClick={() => setIsAddingSection(true)}
            className="box-muted shrink-0 h-20 border-2 border-dashed border-slate-200 hover:border-slate-300 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 text-slate-400 hover:text-slate-600 group"
          >
            <span className="text-body-caption font-bold select-none tracking-tight">+</span>
            <span className="text-body-caption font-bold select-none tracking-tight">
              일정 없이 방문했던 지역 사진 직접 추가하기
            </span>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-primary/40 box-white p-4 shrink-0 flex flex-col gap-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary select-none">
                📍 추억을 기록할 새로운 지역 선택
              </span>
              <button
                onClick={() => { setIsAddingSection(false); setSelectedNewRegion(""); }}
                className="text-slate-400 hover:text-dark text-xs font-medium transition-colors"
              >
                취소
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedNewRegion}
                onChange={(e) => setSelectedNewRegion(e.target.value)}
                className="flex-1 h-10 px-3 text-xs focus:outline-none input-custom bg-pure-white font-bold text-dark"
              >
                <option value="">-- 지역을 선택하세요 --</option>
                {REGION_OPTIONS.map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
              <button onClick={handleDirectRegionSubmit} className="btn-primary h-10 px-5 text-xs shrink-0">
                기록 바로가기
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : historyList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 select-none text-sm">
            아직 완료된 일정 기록이 없습니다.
          </div>
        ) : (
          historyList.map((history) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = parseLocalDate(history.end_date) < today;

            return (
              <div
                key={history.id}
                className="box-white px-5 p-3 flex items-center justify-between shadow-card hover:border-slate-200 transition-all shrink-0"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-body-main font-bold text-dark">{history.title}</span>
                    {isPast ? (
                      <span className="badge badge-sm bg-slate-100 text-slate-500 border-0">지난 일정</span>
                    ) : (
                      <span className="badge badge-sm bg-primary/10 text-primary border-primary/20">진행 중</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <span className="text-xs text-slate-500 font-medium">{history.region}</span>
                    <span className="text-[10px] text-slate-400">
                      {history.start_date.split("T")[0]} ~ {history.end_date.split("T")[0]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleViewSchedule(history.id)} className="btn-ghost h-9 px-4 text-body-caption">
                    일정 보기
                  </button>
                  <button onClick={() => onSelectRegion(history.region)} className="btn-secondary h-9 px-4 text-body-caption">
                    사진 보기
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(history.id, history.title)}
                    disabled={deletingId === history.id}
                    className="btn-danger h-9 px-3 text-body-caption"
                  >
                    {deletingId === history.id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
