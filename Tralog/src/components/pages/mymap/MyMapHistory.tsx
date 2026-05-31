// ===================================================
// MyMapHistory.tsx - 여행 기록 히스토리 목록
// ===================================================

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
  status?: string;
}

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

const parseLocalDate = (raw: string): Date => {
  const dateStr = raw.split("T")[0];
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export default function MyMapHistory({
  onSelectRegion,
  onNavigate,
}: MyMapHistoryProps) {
  const [historyList, setHistoryList] = useState<ScheduleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [selectedNewRegion, setSelectedNewRegion] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // 언마운트 후 setState 호출 방지용

    const loadHistory = async () => {
      const session = localStorage.getItem("tralog_current_user");
      if (!session) return;
      const user = JSON.parse(session);

      if (isMounted) setIsLoading(true);

      try {
        const historyRes = await fetch(
          `${API_BASE_URL}/api/schedules/history/${user.id}`,
        );
        const historyData: ScheduleRow[] = historyRes.ok
          ? await historyRes.json()
          : [];

        const activeRes = await fetch(
          `${API_BASE_URL}/api/schedules/active/${user.id}`,
        );
        const activeData: ScheduleRow[] = activeRes.ok
          ? await activeRes.json()
          : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiredActive = activeData.filter((item) => {
          const endDate = parseLocalDate(item.end_date);
          return endDate < today;
        });

        const historyIds = new Set(historyData.map((h) => h.id));
        const mergedExpired = expiredActive.filter(
          (item) => !historyIds.has(item.id),
        );

        const combined = [...historyData, ...mergedExpired].sort((a, b) => {
          return (
            parseLocalDate(b.end_date).getTime() -
            parseLocalDate(a.end_date).getTime()
          );
        });

        if (isMounted) {
          setHistoryList(combined);
        }
      } catch (err) {
        console.error("히스토리 로드 오류:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // 💡 에러 해결: 브라우저 페인트 완료 후 안전하게 상태를 업데이트 하도록 setTimeout 적용
    const delayFetch = setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(delayFetch);
    };
  }, []);

  const handleViewSchedule = (scheduleId: string) => {
    localStorage.setItem("tralog_active_schedule_id", scheduleId);
    onNavigate("handleschedule", scheduleId);
  };

  const handleDeleteSchedule = async (scheduleId: string, title: string) => {
    if (
      !window.confirm(
        `"${title}" 일정을 삭제하시겠습니까?\n\n관련 장소, 지출, 사진 기록도 모두 삭제됩니다.`,
      )
    )
      return;

    setDeletingId(scheduleId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
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
    localStorage.setItem(
      "tralog_active_schedule_id",
      `direct-${selectedNewRegion}`,
    );
    onSelectRegion(selectedNewRegion);
  };

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
                className="btn-primary h-10 px-5 text-xs shrink-0"
              >
                기록 바로가기
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs animate-pulse">
            불러오는 중...
          </div>
        ) : historyList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 select-none text-sm">
            아직 완료된 일정 기록이 없습니다.
          </div>
        ) : (
          historyList.map((history) => {
            const endDate = parseLocalDate(history.end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = endDate < today;

            return (
              <div
                key={history.id}
                className="box-white p-5 flex items-center justify-between shadow-card hover:border-slate-200 transition-all shrink-0"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body-main font-bold text-dark">
                      {history.title}
                    </span>
                    {isPast && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        지난 일정
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {history.region}
                    {"  ·  "}
                    {history.start_date.split("T")[0]} ~{" "}
                    {history.end_date.split("T")[0]}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleViewSchedule(history.id)}
                    className="btn-ghost h-9 px-4 text-body-caption"
                  >
                    지난 일정 보기
                  </button>
                  <button
                    onClick={() => onSelectRegion(history.region)}
                    className="btn-secondary h-9 px-4 text-body-caption"
                  >
                    사진 보기
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteSchedule(history.id, history.title)
                    }
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
