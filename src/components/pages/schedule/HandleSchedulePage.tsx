// src/components/pages/schedule/HandleSchedulePage.tsx

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
    title: "일정 로딩 중...",
    period: "",
    region: "",
  });
  const [mapPlaces, setMapPlaces] = useState<PlaceMarker[]>([]);

  const fetchScheduleData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
      if (!res.ok) return;
      const data = await res.json();
      const meta = data.meta;
      const start = meta.start_date?.slice(0, 10) ?? "";
      const end = meta.end_date?.slice(0, 10) ?? "";

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
    } catch (err) {
      console.error("일정 데이터 로딩 중 에러 발생:", err);
    }
  }, [scheduleId]);

  useEffect(() => {
    const initPage = async () => {
      if (!currentUser) {
        onNavigate("login");
        return;
      }
      await fetchScheduleData();
    };
    void initPage();
  }, [currentUser, onNavigate, fetchScheduleData]);

  const toggleEditMode = (mode: boolean) => {
    if (mode) {
      setEditTitle(scheduleMeta.title);
      setEditStartDate(scheduleMeta.start_date || "");
      setEditEndDate(scheduleMeta.end_date || "");
    }
    setIsEditing(mode);
  };

  const handlePlaceAdded = useCallback((place: PlaceMarker) => {
    setMapPlaces((prev) => [...prev, place]);
  }, []);

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
          period: `${editStartDate} ~ ${editEndDate}`,
        }));
        setIsEditing(false);
      } else {
        alert("일정 정보 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  if (!currentUser) return null;

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans antialiased text-dark overflow-hidden">
      <NavBar
        userName={currentUser.name}
        onNavigate={onNavigate}
        onLogout={() => {
          localStorage.removeItem("tralog_current_user");
          onNavigate("login");
        }}
      />

      <main className="flex-1 h-0 w-[90%] max-w-7xl mx-auto py-6 flex flex-col gap-5 items-stretch overflow-hidden">
        {/* ✅ 피그마 디자인: 배경을 없애고 텍스트와 우측 박스만 배치 */}
        <div className="flex items-end justify-between shrink-0 mb-1 pl-2">
          {/* 왼쪽: 제목 및 날짜 정보 */}
          <div className="flex flex-col gap-1.5">
            {isEditing ? (
              <div className="flex gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-black text-dark border border-slate-300 rounded-lg px-3 py-1 bg-slate-50 focus:outline-none focus:border-primary"
                  placeholder="여행 제목 입력"
                />
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="text-xs font-bold text-slate-600 bg-transparent focus:outline-none"
                  />
                  <span className="text-slate-400">~</span>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="text-xs font-bold text-slate-600 bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleUpdateMeta}
                  className="px-4 py-1.5 bg-[#0d9488] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-teal-700 ml-1"
                >
                  확인
                </button>
                <button
                  onClick={() => toggleEditMode(false)}
                  className="px-4 py-1.5 bg-slate-200 text-dark text-xs font-bold rounded-lg shadow-sm hover:bg-slate-300"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-[26px] font-black tracking-tight text-dark m-0 leading-none">
                  {scheduleMeta.title}
                </h1>
                {scheduleMeta.period && (
                  <div className="flex items-center gap-1 mt-1 opacity-90">
                    <span className="text-sm font-bold text-slate-800 tracking-wide">
                      {scheduleMeta.period}
                    </span>
                    <span className="text-[10px] grayscale ml-1">✏️</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 오른쪽: 하얀색 알약 모양 탭 메뉴 및 컨트롤 버튼 */}
          <ScheduleHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isEditing={isEditing}
            onToggleEdit={() => toggleEditMode(!isEditing)}
            onNavigate={onNavigate}
          />
        </div>

        {/* 하단 메인 콘텐츠 (지도 & 세부 섹션) */}
        <div className="flex-1 h-0 flex flex-row gap-6 items-stretch overflow-hidden">
          {/* 좌측 지도 */}
          <div className="w-1/2 flex flex-col shrink-0 h-full bg-white rounded-4xl shadow-sm border border-slate-200 p-2 overflow-hidden">
            <NaverMapContainer
              places={mapPlaces}
              centerLat={getRegionCenter(scheduleMeta.region).lat}
              centerLng={getRegionCenter(scheduleMeta.region).lng}
            />
          </div>

          {/* 우측 탭별 상세 내용 */}
          <div className="w-1/2 flex flex-col h-full bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">
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
              <CompanionSection userId={currentUser.id} />
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
    제주특별자치도: { lat: 33.4996, lng: 126.5312 },
  };
  return centers[region] ?? { lat: 37.5665, lng: 126.978 };
}
