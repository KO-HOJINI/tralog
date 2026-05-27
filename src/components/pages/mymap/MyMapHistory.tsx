// src/components/pages/mymap/MyMapHistory.tsx
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../config/api";

interface MyMapHistoryProps {
  onSelectRegion: (region: string) => void;
  onNavigate: (page: string, scheduleId?: string) => void;
}

interface ScheduleRow {
  id: string;
  title: string;
  region: string;
  start_date: string;
  end_date: string;
}

const REGION_OPTIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "경기도", "강원특별자치도", "충청북도", "충청남도",
  "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

export default function MyMapHistory({
  onSelectRegion,
  onNavigate,
}: MyMapHistoryProps) {
  const [historyList, setHistoryList] = useState<ScheduleRow[]>([]);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [selectedNewRegion, setSelectedNewRegion] = useState("");
  // ✅ 삭제 중인 항목 ID 추적 (버튼 중복 클릭 방지)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = () => {
    const session = localStorage.getItem("tralog_current_user");
    if (!session) return;
    const user = JSON.parse(session);

    fetch(`${API_BASE_URL}/api/schedules/history/${user.id}`)
      .then((res) => res.json())
      .then((data) => setHistoryList(data))
      .catch((err) => console.error("히스토리 로드 오류:", err));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleViewSchedule = (scheduleId: string) => {
    localStorage.setItem("tralog_active_schedule_id", scheduleId);
    onNavigate("handleschedule", scheduleId);
  };

  // ✅ 일정 삭제 핸들러 (DB 연동)
  const handleDeleteSchedule = async (scheduleId: string, title: string) => {
    if (!window.confirm(`"${title}" 일정을 삭제하시겠습니까?\n\n관련 장소, 지출, 사진 기록도 모두 삭제됩니다.`)) return;

    setDeletingId(scheduleId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // 로컬 상태에서 즉시 제거 (re-fetch 없이 빠른 UI 반응)
        setHistoryList((prev) => prev.filter((h) => h.id !== scheduleId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`삭제 실패: ${err.message || "서버 오류"}`);
      }
    } catch (e) {
      alert("서버 연결 오류가 발생했습니다.");
      console.error("삭제 오류:", e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDirectRegionSubmit = () => {
    if (!selectedNewRegion) {
      alert("기록을 추가할 지역을 선택해 주세요.");
      return;
    }
    localStorage.setItem("tralog_active_schedule_id", `direct-${selectedNewRegion}`);
    onSelectRegion(selectedNewRegion);
  };

  return (
    <div className="flex-col-full gap-4">
      {/* 타이틀 헤더 */}
      <div className="flex flex-col gap-0.5 px-1 shrink-0 select-none">
        <h2>나의 여행 기록 히스토리</h2>
        <p className="text-body-caption text-slate-400">
          완료된 여행의 소중한 순간과 발자취를 확인하세요
        </p>
      </div>

      {/* 리스트 스크롤 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar pr-1 flex flex-col gap-3">
        {/* 일정 미생성 지역 직접 추가 카드 */}
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
              <button
                onClick={handleDirectRegionSubmit}
                className="btn btn-custom h-10 px-5 bg-primary text-white font-bold text-xs transition-all shrink-0"
              >
                기록 바로가기
              </button>
            </div>
          </div>
        )}

        {/* 히스토리 리스트 */}
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

              <div className="flex items-center gap-2 shrink-0">
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
                {/* ✅ 삭제 버튼 추가 */}
                <button
                  onClick={() => handleDeleteSchedule(history.id, history.title)}
                  disabled={deletingId === history.id}
                  className="btn btn-custom h-9 px-3 bg-red-50 hover:bg-red-100 text-red-500 text-body-caption font-bold transition-all border border-red-200/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === history.id ? "삭제 중..." : "🗑️ 삭제"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
