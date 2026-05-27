// MyMapHistory.tsx 풀코드
import { useState, useEffect } from "react";

interface MyMapHistoryProps {
  onSelectRegion: (region: string) => void;
  onNavigate: (page: string) => void;
}

interface ScheduleRow {
  id: string;
  title: string;
  region: string;
  start_date: string;
  end_date: string;
}

// 대한민국 대표 행정구역 리스트 (InteractiveMap 매핑용)
const REGION_OPTIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전라북도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

export default function MyMapHistory({
  onSelectRegion,
  onNavigate,
}: MyMapHistoryProps) {
  const [historyList, setHistoryList] = useState<ScheduleRow[]>([]);
  const [isAddingSection, setIsAddingSection] = useState<boolean>(false);
  const [selectedNewRegion, setSelectedNewRegion] = useState<string>("");

  useEffect(() => {
    const session = localStorage.getItem("tralog_current_user");
    if (!session) return;
    const user = JSON.parse(session);

    // 백엔드로부터 완료된 지난 여정 리스트 로드
    fetch(`http://localhost:5000/api/schedules/history/${user.id}`)
      .then((res) => res.json())
      .then((data) => setHistoryList(data))
      .catch((err) => console.error("히스토리 로드 오류:", err));
  }, []);

  const handleViewSchedule = (scheduleId: string) => {
    localStorage.setItem("tralog_active_schedule_id", scheduleId);
    onNavigate("handleschedule");
  };

  // 일정 없는 지역 사진 직접 추가 처리
  const handleDirectRegionSubmit = () => {
    if (!selectedNewRegion) {
      alert("기록을 추가할 지역을 선택해 주세요.");
      return;
    }

    // 💡 중요: 업로드 실패를 방지하기 위해 가상 스케줄 ID를 부여하여 매핑 유도
    localStorage.setItem(
      "tralog_active_schedule_id",
      `direct-${selectedNewRegion}`,
    );
    onSelectRegion(selectedNewRegion);
  };

  return (
    <div className="flex-col-full gap-4">
      {/* 타이틀 헤더 영역 */}
      <div className="flex flex-col gap-0.5 px-1 shrink-0 select-none">
        <h2>나의 여행 기록 히스토리</h2>
        <p className="text-body-caption text-slate-400">
          완료된 여행의 소중한 순간과 발자취를 확인하세요
        </p>
      </div>

      {/* 리스트 스크롤 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar pr-1 flex flex-col gap-3">
        {/* 맨 윗줄: 일정 미생성 지역 사진 추가 카드 */}
        {!isAddingSection ? (
          <div
            onClick={() => setIsAddingSection(true)}
            className="box-custom shrink-0 h-20 border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-100/80 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 text-slate-400 hover:text-slate-600 group"
          >
            <span className="text-md font-bold p-1 bg-white rounded-full shadow-xs group-hover:scale-110 transition-transform flex items-center justify-center w-7 h-7 border border-slate-100 text-slate-400">
              +
            </span>
            <span className="text-body-caption font-bold select-none tracking-tight">
              일정 없이 방문했던 지역 사진 직접 추가하기
            </span>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-primary/40 box-custom p-4 shrink-0 flex flex-col gap-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary select-none">
                📍 추억을 기록할 새로운 지역 선택
              </span>
              <button
                onClick={() => {
                  setIsAddingSection(false);
                  setSelectedNewRegion("");
                }}
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
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
              <button
                onClick={handleDirectRegionSubmit}
                className="btn btn-custom h-10 px-5 bg-primary text-white font-bold text-xs transition-all shrink-0"
              >
                기록 바로가기
              </button>
            </div>
          </div>
        )}

        {/* 기존 히스토리 리스트 렌더링 */}
        {historyList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 select-none text-sm">
            아직 완료된 일정 기록이 없습니다.
          </div>
        ) : (
          historyList.map((history) => (
            <div
              key={history.id}
              className="bg-pure-white border border-slate-100/70 box-custom p-5 flex items-center justify-between shadow-card hover:border-slate-200 transition-all shrink-0"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body-main font-bold text-dark">
                  {history.title}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {history.region} ({history.start_date.split("T")[0]} ~{" "}
                  {history.end_date.split("T")[0]})
                </span>
              </div>
              {/* 🎨 버튼 스타일 통일 완료 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleViewSchedule(history.id)}
                  className="btn btn-custom h-9 px-4 bg-gray text-white text-body-caption font-bold transition-all"
                >
                  지난 일정 보기
                </button>
                <button
                  onClick={() => onSelectRegion(history.region)}
                  className="btn btn-custom h-9 px-4 bg-secondary text-white text-body-caption font-bold transition-all shadow-xs"
                >
                  사진 보기
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
