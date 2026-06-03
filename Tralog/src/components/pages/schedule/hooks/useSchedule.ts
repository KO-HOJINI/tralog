// useSchedule.ts
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

// 유저 세션 정보 인터페이스 선언
interface UserSession {
  id: string;
  name: string;
}

// 서버에서 넘어오는 장소(Place) 데이터 명세 선언
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

  // 일정 데이터 불러오기 로직
  const fetchScheduleData = useCallback(
    async (isMounted: boolean) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) return;
        const data = await res.json();
        const meta = data.meta;

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

  // 메타 정보 서버에 수정 요청
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
          period:
            editStartDate && editEndDate
              ? `${editStartDate} ~ ${editEndDate}`
              : "",
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