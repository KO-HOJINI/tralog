// useMapHistory.ts - 나만의 지도 히스토리 커스텀 훅
// 여행 기록 목록 로드, 일정 삭제, 직접 지역 추가 담당
// MyMapHistory 컴포넌트의 데이터 로직 분리
//
// ※ AI 도움 - isMounted 패턴 (언마운트 후 setState 호출 방지)

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

// "T"가 포함된 ISO 날짜 문자열을 로컬 Date 객체로 변환
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
    // isMounted로 언마운트 후 setState 호출 방지 (※ AI 도움)
    let isMounted = true;

    const loadHistory = async () => {
      const session = localStorage.getItem("tralog_current_user");
      if (!session) return;
      const user = JSON.parse(session) as { id: string };

      if (isMounted) setIsLoading(true);

      try {
        // 완료된 일정 + 진행 중인 일정을 병렬로 로드 (예전엔 순차라 왕복이 2번 직렬로 쌓였음).
        // 이 목록은 대표사진을 쓰지 않으므로 ?images=0 으로 base64를 빼서 응답을 가볍게 받는다.
        const [historyRes, activeRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/schedules/history/${user.id}?images=0`),
          fetch(`${API_BASE_URL}/api/schedules/active/${user.id}?images=0`),
        ]);
        const historyData: ScheduleRow[] = historyRes.ok ? await historyRes.json() : [];
        const activeData: ScheduleRow[] = activeRes.ok ? await activeRes.json() : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 진행 중 일정 중 종료됐거나 사진이 있는 것만 히스토리에 포함
        const activeWithPhotosOrPast = activeData.filter((item) => {
          const endDate = parseLocalDate(item.end_date);
          return endDate < today || (item.photo_count && item.photo_count > 0);
        });

        // 중복 제거 후 종료일 기준 내림차순 정렬
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

  // 일정 보기 - 해당 일정의 편집 페이지로 이동
  const handleViewSchedule = (scheduleId: string) => {
    localStorage.setItem("tralog_active_schedule_id", scheduleId);
    onNavigate("handleschedule", scheduleId);
  };

  // 일정 삭제 - 확인 후 서버에서 삭제하고 목록에서 제거
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

  // 일정 없이 방문한 지역 직접 추가
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
