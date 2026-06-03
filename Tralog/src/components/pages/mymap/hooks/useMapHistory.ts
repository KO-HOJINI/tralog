import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../../config/api";

export interface ScheduleRow {
  id: string;
  title: string;
  region: string;
  start_date: string;
  end_date: string;
  status?: string;
  photo_count?: number;
}

export const parseLocalDate = (raw: string): Date => {
  const dateStr = raw.split("T")[0];
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function useMapHistory(
  onNavigate: (page: string, scheduleId?: string) => void,
  onSelectRegion: (region: string) => void,
) {
  const [historyList, setHistoryList] = useState<ScheduleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [selectedNewRegion, setSelectedNewRegion] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      const session = localStorage.getItem("tralog_current_user");
      if (!session) return;
      const user = JSON.parse(session) as { id: string };

      if (isMounted) setIsLoading(true);

      try {
        const historyRes = await fetch(`${API_BASE_URL}/api/schedules/history/${user.id}`);
        const historyData: ScheduleRow[] = historyRes.ok ? await historyRes.json() : [];

        const activeRes = await fetch(`${API_BASE_URL}/api/schedules/active/${user.id}`);
        const activeData: ScheduleRow[] = activeRes.ok ? await activeRes.json() : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeWithPhotosOrPast = activeData.filter((item) => {
          const endDate = parseLocalDate(item.end_date);
          return endDate < today || (item.photo_count && item.photo_count > 0);
        });

        const historyIds = new Set(historyData.map((h) => h.id));
        const mergedActive = activeWithPhotosOrPast.filter((item) => !historyIds.has(item.id));

        const combined = [...historyData, ...mergedActive].sort(
          (a, b) => parseLocalDate(b.end_date).getTime() - parseLocalDate(a.end_date).getTime(),
        );

        if (isMounted) setHistoryList(combined);
      } catch (err) {
        console.error("히스토리 로드 오류:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const delayFetch = setTimeout(() => { void loadHistory(); }, 0);
    return () => { isMounted = false; clearTimeout(delayFetch); };
  }, []);

  const handleViewSchedule = (scheduleId: string) => {
    localStorage.setItem("tralog_active_schedule_id", scheduleId);
    onNavigate("handleschedule", scheduleId);
  };

  const handleDeleteSchedule = async (scheduleId: string, title: string) => {
    if (!window.confirm(`"${title}" 일정을 삭제하시겠습니까?\n\n관련 장소, 지출, 사진 기록도 모두 삭제됩니다.`)) return;

    setDeletingId(scheduleId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, { method: "DELETE" });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((h) => h.id !== scheduleId));
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        alert(`삭제 실패: ${err.message ?? "서버 오류"}`);
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

  return {
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
  };
}
