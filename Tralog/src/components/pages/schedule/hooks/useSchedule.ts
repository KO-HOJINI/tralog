// useSchedule.ts - 일정 편집 페이지의 데이터 관련 커스텀 훅
// 일정 정보 불러오기, 제목/날짜 수정, 지역 변경, 일정 삭제 기능을 담당합니다.
// 컴포넌트가 복잡해지는 것을 막기 위해 데이터 로직을 훅으로 분리했습니다.
//
// ※ AI 도움을 받아 구현한 부분
// useCallback으로 fetchScheduleData 함수를 메모이제이션해서
// useEffect의 의존성 배열 문제를 해결하는 방법을 AI 도움으로 작성했습니다.

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../../../config/api";
import { type PlaceMarker } from "../NaverMapContainer";

interface ScheduleMeta {
  title: string;
  period: string;
  region: string;
  start_date?: string;
  end_date?: string;
}

interface UserSession {
  id: string;
  name: string;
}

interface ApiPlace {
  id: string;
  place_name: string;
  day_number: number;
  visit_time: string;
  lat: number;
  lng: number;
}

export function useSchedule(
  scheduleId: string,
  currentUser: UserSession | null,
  onNavigate: (page: string) => void,
) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const [scheduleMeta, setScheduleMeta] = useState<ScheduleMeta>({
    title: "로딩 중...",
    period: "",
    region: "",
  });
  const [mapPlaces, setMapPlaces] = useState<PlaceMarker[]>([]);

  // ※ AI 도움을 받아 구현했습니다
  // useCallback으로 감싸서 scheduleId가 바뀔 때만 함수를 새로 생성합니다.
  // 이렇게 하지 않으면 useEffect가 매 렌더마다 실행되는 문제가 생깁니다.
  const fetchScheduleData = useCallback(
    async (isMounted: boolean) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) return;
        const data = await res.json();
        const meta = data.meta;

        // 서버에서 오는 날짜가 ISO 형식("T" 포함)이면 로컬 날짜 문자열로 변환합니다
        const formatLocalDateString = (rawDate: string | undefined) => {
          if (!rawDate) return "";
          if (rawDate.includes("T")) {
            const dateObj = new Date(rawDate);
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, "0");
            const d = String(dateObj.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }
          return rawDate.slice(0, 10);
        };

        const start = formatLocalDateString(meta.start_date);
        const end = formatLocalDateString(meta.end_date);

        if (isMounted) {
          setScheduleMeta({
            title: meta.title,
            period: start && end ? `${start} ~ ${end}` : "",
            region: meta.region,
            start_date: start,
            end_date: end,
          });

          // 지도에 표시할 마커 데이터로 변환합니다
          const markers: PlaceMarker[] = (data.places || []).map((p: ApiPlace) => ({
            id: p.id,
            place_name: p.place_name,
            day_number: p.day_number,
            visit_time: p.visit_time,
            lat: p.lat,
            lng: p.lng,
          }));
          setMapPlaces(markers);
        }
      } catch (err) {
        console.error("일정 로딩 오류:", err);
      }
    },
    [scheduleId],
  );

  useEffect(() => {
    if (!currentUser) {
      onNavigate("login");
      return;
    }

    let isMounted = true;
    const delayFetch = setTimeout(() => {
      void fetchScheduleData(isMounted);
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(delayFetch);
    };
  }, [currentUser, onNavigate, fetchScheduleData]);

  // 편집 모드에서 저장 버튼을 눌렀을 때 제목/날짜를 서버에 저장합니다
  const handleUpdateMeta = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          start_date: editStartDate,
          end_date: editEndDate,
        }),
      });

      if (res.ok) {
        setScheduleMeta((prev) => ({
          ...prev,
          title: editTitle,
          start_date: editStartDate,
          end_date: editEndDate,
          period: editStartDate && editEndDate ? `${editStartDate} ~ ${editEndDate}` : "",
        }));
        setIsEditing(false);
      } else {
        alert("수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("일정 수정 오류:", err);
      alert("오류가 발생했습니다.");
    }
  };

  // 편집 버튼 클릭 → 편집 모드 진입 / 저장 버튼 클릭 → 서버에 저장
  const handleToggleEdit = () => {
    if (isEditing) {
      handleUpdateMeta();
    } else {
      setEditTitle(scheduleMeta.title);
      setEditStartDate(scheduleMeta.start_date || "");
      setEditEndDate(scheduleMeta.end_date || "");
      setIsEditing(true);
    }
  };

  // 편집 모드에서 지역 드롭다운을 변경하면 즉시 서버에 저장합니다
  const handleChangeRegion = async (newRegion: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: newRegion }),
      });
      if (res.ok) {
        setScheduleMeta((prev) => ({ ...prev, region: newRegion }));
      } else {
        alert("지역 변경에 실패했습니다.");
      }
    } catch (err) {
      console.error("지역 변경 오류:", err);
      alert("오류가 발생했습니다.");
    }
  };

  // 일정 삭제 - 확인 후 서버에서 삭제하고 대시보드로 이동합니다
  const handleDeleteSchedule = async () => {
    if (!window.confirm("일정을 삭제하시겠습니까?\n\n관련 장소, 지출, 사진 기록도 모두 삭제됩니다.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        localStorage.removeItem("tralog_active_schedule_id");
        onNavigate("dashboard");
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("일정 삭제 오류:", err);
      alert("오류가 발생했습니다.");
    }
  };

  // 장소가 추가됐을 때 지도 마커 목록에 바로 반영합니다
  const handlePlaceAdded = useCallback((place: PlaceMarker) => {
    setMapPlaces((prev) => [...prev, place]);
  }, []);

  return {
    scheduleMeta,
    mapPlaces,
    isEditing,
    editTitle,
    setEditTitle,
    editStartDate,
    setEditStartDate,
    editEndDate,
    setEditEndDate,
    handleToggleEdit,
    handleChangeRegion,
    handleDeleteSchedule,
    handlePlaceAdded,
  };
}
