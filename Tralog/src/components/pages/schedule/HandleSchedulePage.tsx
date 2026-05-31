// ===================================================
// HandleSchedulePage.tsx - 일정 편집 메인 페이지
// ===================================================

import { useState, useEffect, useCallback } from "react";
import NavBar from "../../Navbar";
import ScheduleHeader from "./ScheduleHeader";
import TimelineSection from "./TimelineSection";
import AccountBookSection from "./AccountBookSection";
import CompanionSection from "./CompanionSection";
import NaverMapContainer, { type PlaceMarker } from "./NaverMapContainer";
import { API_BASE_URL } from "../../../config/api";

interface HandleSchedulePageProps {
  onNavigate: (page: string) => void;
  scheduleId?: string;
}

interface UserSession {
  id: string;
  name: string;
}

interface ScheduleMeta {
  title: string;
  period: string;
  region: string;
  start_date?: string;
  end_date?: string;
}

interface ApiPlace {
  id: string;
  place_name: string;
  day_number: number;
  visit_time: string;
  lat: number;
  lng: number;
}

export default function HandleSchedulePage({
  onNavigate,
  scheduleId: scheduleIdProp,
}: HandleSchedulePageProps) {
  const [currentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  const [scheduleId] = useState<string>(
    () =>
      scheduleIdProp ||
      localStorage.getItem("tralog_active_schedule_id") ||
      "s-1",
  );
  const [activeTab, setActiveTab] = useState<string>("timeline");
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

  // 💡 데이터 마운팅 유효 검증을 위한 내부 클로저 플래그 파라미터 전달 가능하도록 수정
  const fetchScheduleData = useCallback(
    async (isMounted: boolean) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) return;
        const data = await res.json();
        const meta = data.meta;
        const start = meta.start_date?.slice(0, 10) ?? "";
        const end = meta.end_date?.slice(0, 10) ?? "";

        if (isMounted) {
          setScheduleMeta({
            title: meta.title,
            period: start && end ? `${start} ~ ${end}` : "",
            region: meta.region,
            start_date: start,
            end_date: end,
          });

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

    // 💡 에러 해결: useEffect 내부에서 즉시 동기 실행되어 발생하는 렌더 트래킹 경고 해결
    const delayFetch = setTimeout(() => {
      void fetchScheduleData(isMounted);
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(delayFetch);
    };
  }, [currentUser, onNavigate, fetchScheduleData]);

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

  const handlePlaceAdded = useCallback((place: PlaceMarker) => {
    setMapPlaces((prev) => [...prev, place]);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="h-screen bg-background flex flex-col font-sans antialiased text-dark overflow-hidden">
      <NavBar
        userName={currentUser.name}
        onNavigate={onNavigate}
        onLogout={() => {
          localStorage.removeItem("tralog_current_user");
          onNavigate("login");
        }}
      />

      <main className="flex-1 h-0 w-[70%] max-w-300 mx-auto py-6 flex flex-col overflow-hidden">
        <div className="flex w-full gap-5 items-end shrink-0 pb-5">
          <div className="flex-1 flex flex-col gap-2.5 items-start pl-1">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="여행 제목 입력"
                  className="text-xl font-black text-dark bg-slate-100 border border-slate-300 shadow-inner focus:border-primary focus:bg-white focus:outline-none rounded-3xl px-4 py-2 w-[80%] transition-all"
                />
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 shadow-inner focus-within:border-primary focus-within:bg-white rounded-3xl px-4 py-1.5 transition-all w-fit">
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="text-[13px] font-bold text-slate-600 bg-transparent focus:outline-none cursor-pointer"
                  />
                  <span className="text-slate-400 text-xs">~</span>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="text-[13px] font-bold text-slate-600 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
              </>
            ) : (
              <>
                <h1 className="text-[26px] font-black tracking-tight text-dark m-0 leading-none">
                  {scheduleMeta.title}
                </h1>
                {scheduleMeta.period && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[14px] font-bold text-slate-700 tracking-wide">
                      {scheduleMeta.period}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex-1 shrink-0">
            <ScheduleHeader
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isEditing={isEditing}
              onToggleEdit={handleToggleEdit}
              onNavigate={onNavigate}
              scheduleRegion={scheduleMeta.region}
            />
          </div>
        </div>

        <div className="flex-1 h-0 flex w-full gap-5 items-stretch overflow-hidden">
          <div className="flex-1 shrink-0 h-full box-white p-2 overflow-hidden">
            <NaverMapContainer
              places={mapPlaces}
              centerLat={getRegionCenter(scheduleMeta.region).lat}
              centerLng={getRegionCenter(scheduleMeta.region).lng}
            />
          </div>

          <div className="flex-1 h-full box-white overflow-hidden flex flex-col">
            {activeTab === "timeline" && (
              <TimelineSection
                userId={currentUser.id}
                scheduleId={scheduleId}
                isEditing={isEditing}
                startDate={scheduleMeta.start_date}
                endDate={scheduleMeta.end_date}
                onPlaceAdded={handlePlaceAdded}
              />
            )}
            {activeTab === "account" && (
              <AccountBookSection scheduleId={scheduleId} />
            )}
            {activeTab === "companion" && (
              <CompanionSection
                userId={currentUser.id}
                scheduleTitle={scheduleMeta.title}
                schedulePeriod={scheduleMeta.period}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getRegionCenter(region: string): { lat: number; lng: number } {
  const centers: Record<string, { lat: number; lng: number }> = {
    서울특별시: { lat: 37.5665, lng: 126.978 },
    부산광역시: { lat: 35.1796, lng: 129.0756 },
    대구광역시: { lat: 35.8714, lng: 128.6014 },
    인천광역시: { lat: 37.4563, lng: 126.7052 },
    광주광역시: { lat: 35.1595, lng: 126.8526 },
    대전광역시: { lat: 36.3504, lng: 127.3845 },
    울산광역시: { lat: 35.5384, lng: 129.3114 },
    경기도: { lat: 37.2752, lng: 127.0095 },
    강원특별자치도: { lat: 37.8228, lng: 128.1555 },
    충청북도: { lat: 36.6357, lng: 127.4917 },
    충청남도: { lat: 36.6588, lng: 126.6728 },
    전북특별자치도: { lat: 35.7175, lng: 127.153 },
    전라남도: { lat: 34.8679, lng: 126.991 },
    경상북도: { lat: 36.4919, lng: 128.8889 },
    경상남도: { lat: 35.4606, lng: 128.2132 },
    제주특별자치도: { lat: 33.4996, lng: 126.5312 },
  };
  return centers[region] ?? { lat: 37.5665, lng: 126.978 };
}
