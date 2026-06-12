// useSchedule.ts - 일정 편집 페이지 데이터 커스텀 훅
// 일정 정보 로드, 제목/날짜 수정, 지역 변경, 일정 삭제 담당
// 컴포넌트가 복잡해지지 않도록 데이터 로직을 훅으로 분리
//
// ※ AI 도움 - useCallback으로 fetchScheduleData 메모이제이션해 useEffect 의존성 문제 해결

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

interface ApiCompanion {
  id: string;
  name: string;
  role: "read" | "edit";
}

export function useSchedule(
  scheduleId: string,
  currentUser: UserSession | null,
  onNavigate: (page: string) => void,
) {
  const [isEditing, setIsEditing] = useState<boolean>(false); // 편집 모드 on/off
  // 편집 권한: 소유자이거나 edit 권한 일행만 true. read 일행은 편집 불가.
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState(""); // 편집 폼 - 제목 입력값
  const [editStartDate, setEditStartDate] = useState(""); // 편집 폼 - 시작일 입력값
  const [editEndDate, setEditEndDate] = useState(""); // 편집 폼 - 종료일 입력값

  // 화면 표시용 일정 메타 정보 (제목/기간/지역)
  const [scheduleMeta, setScheduleMeta] = useState<ScheduleMeta>({
    title: "로딩 중...",
    period: "",
    region: "",
  });
  const [mapPlaces, setMapPlaces] = useState<PlaceMarker[]>([]); // 지도에 찍을 장소 마커 목록

  // 일정 데이터 로드 - scheduleId 바뀔 때만 함수 재생성 (※ AI 도움)
  // 이렇게 안 하면 useEffect가 매 렌더마다 실행됨
  const fetchScheduleData = useCallback(
    async (isMounted: boolean) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) return;
        const data = await res.json();
        const meta = data.meta;

        // 서버 날짜가 ISO 형식("T" 포함)이면 로컬 날짜 문자열로 변환
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

          // 지도에 표시할 마커 데이터로 변환
          const markers: PlaceMarker[] = (data.places || []).map(
            (p: ApiPlace) => ({
              id: p.id,
              place_name: p.place_name,
              day_number: p.day_number,
              visit_time: p.visit_time,
              lat: p.lat,
              lng: p.lng,
            }),
          );
          setMapPlaces(markers);

          // 편집 권한 판별: 소유자 OR 'edit' 권한으로 초대된 일행만 편집 가능.
          const isOwner = meta.user_id === currentUser?.id;
          const myCompanion = (
            data.companions as ApiCompanion[] | undefined
          )?.find((c) => c.id === currentUser?.id);
          setCanEdit(isOwner || myCompanion?.role === "edit");
        }
      } catch (err) {
        console.error("일정 로딩 오류:", err);
      }
    },
    [scheduleId, currentUser],
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

  // 저장 - 편집한 제목/날짜를 서버에 반영
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

  // 편집/저장 토글 - 편집 모드 진입 또는 저장 실행
  const handleToggleEdit = () => {
    // 읽기 전용 일행 방어
    if (!canEdit) return;
    if (isEditing) {
      handleUpdateMeta();
    } else {
      setEditTitle(scheduleMeta.title);
      setEditStartDate(scheduleMeta.start_date || "");
      setEditEndDate(scheduleMeta.end_date || "");
      setIsEditing(true);
    }
  };

  // 지역 변경 - 드롭다운 변경 즉시 서버에 저장
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

  // 일정 삭제 - 확인 후 서버에서 삭제하고 대시보드로 이동
  const handleDeleteSchedule = async () => {
    if (
      !window.confirm(
        "일정을 삭제하시겠습니까?\n\n관련 장소, 지출, 사진 기록도 모두 삭제됩니다.",
      )
    )
      return;
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

  // 장소 추가 시 지도 마커 목록에 바로 반영
  const handlePlaceAdded = useCallback((place: PlaceMarker) => {
    setMapPlaces((prev) => [...prev, place]);
  }, []);

  // 장소 삭제 시 지도 마커도 함께 제거 (안 하면 삭제된 마커가 남아 번호가 꼬임)
  const handlePlaceDeleted = useCallback((placeId: string) => {
    setMapPlaces((prev) => prev.filter((p) => p.id !== placeId));
  }, []);

  return {
    scheduleMeta,
    mapPlaces,
    isEditing,
    canEdit,
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
    handlePlaceDeleted,
  };
}
