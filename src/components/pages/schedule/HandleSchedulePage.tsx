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
  scheduleId?: string; // ✅ 추가: 외부에서 주입받거나 localStorage에서 읽음
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

export default function HandleSchedulePage({
  onNavigate,
  scheduleId: scheduleIdProp,
}: HandleSchedulePageProps) {
  // ✅ 세션 동기 초기화 (useEffect 경고 방지)
  const [currentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  // ✅ scheduleId: prop → localStorage 순으로 우선순위 적용
  const [scheduleId] = useState<string>(
    () =>
      scheduleIdProp ||
      localStorage.getItem("tralog_active_schedule_id") ||
      "s-1",
  );

  const [activeTab, setActiveTab] = useState<string>("timeline");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [scheduleMeta, setScheduleMeta] = useState<ScheduleMeta>({
    title: "일정 로딩 중...",
    period: "",
    region: "",
  });

  // ✅ 네이버 지도에 표시할 장소 마커 목록
  const [mapPlaces, setMapPlaces] = useState<PlaceMarker[]>([]);

  // ✅ 일정 메타 및 장소 데이터 fetch
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

      // ✅ 타임라인 장소를 지도 마커 배열로 변환
      // 실제 프로덕션에서는 DB에 lat/lng 컬럼을 추가하거나 Geocoding API를 사용하세요.
      // 현재는 장소 이름만 있으므로 마커 데이터 구조만 준비합니다.
      const markers: PlaceMarker[] = (data.places || []).map(
        (p: {
          id: string;
          place_name: string;
          day_number: number;
          visit_time: string;
          lat?: number;
          lng?: number;
        }) => ({
          id: p.id,
          place_name: p.place_name,
          day_number: p.day_number,
          visit_time: p.visit_time,
          lat: p.lat, // schedule_places 테이블에 lat 컬럼 추가 시 사용
          lng: p.lng, // schedule_places 테이블에 lng 컬럼 추가 시 사용
        }),
      );
      setMapPlaces(markers);
    } catch (err) {
      console.error("일정 데이터 fetch 오류:", err);
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

  // ✅ TimelineSection에서 장소 추가 시 호출되는 콜백
  const handlePlaceAdded = useCallback(
    (place: {
      id: string;
      place_name: string;
      lat: number;
      lng: number;
      day_number: number;
      visit_time: string;
    }) => {
      console.log("✅ HandleSchedulePage - 장소 추가 콜백 수신:", place);
      setMapPlaces((prev) => {
        const updated = [
          ...prev,
          {
            id: place.id,
            place_name: place.place_name,
            lat: place.lat,
            lng: place.lng,
            day_number: place.day_number,
            visit_time: place.visit_time,
          },
        ];
        console.log("📍 mapPlaces 업데이트됨, 총 개수:", updated.length);
        return updated;
      });
    },
    [],
  );

  if (!currentUser) return null;

  const handleLogout = () => {
    localStorage.removeItem("tralog_current_user");
    onNavigate("login");
  };

  return (
    <div className="h-screen bg-background flex flex-col font-sans antialiased text-dark overflow-hidden">
      <NavBar
        userName={currentUser.name}
        onNavigate={onNavigate}
        onLogout={handleLogout}
      />

      <main className="flex-1 h-0 w-[70%] mx-auto py-6 flex flex-col gap-4 items-stretch overflow-hidden">
        {/* ✅ 페이지 헤더 */}
        <div className="flex justify-between items-end pb-3 shrink-0 select-none border-b border-slate-200/60">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[28px] font-black tracking-tight text-dark m-0">
              {scheduleMeta.title}
            </h1>
            {scheduleMeta.period && (
              <span className="text-sm font-bold text-primary bg-teal-50 px-3 py-1 rounded-lg border border-teal-200/40">
                {scheduleMeta.period}
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigate("dashboard")}
            className="text-sm font-bold text-gray hover:text-dark transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
          >
            ← 대시보드로 돌아가기
          </button>
        </div>

        {/* ✅ 메인 콘텐츠: 50:50 분할 레이아웃 (MyMapPage와 일관성) */}
        <div className="flex-1 h-0 flex flex-row gap-8 items-stretch overflow-hidden">
          {/* ✅ 좌측: 네이버 지도 */}
          <div className="w-1/2 flex flex-col shrink-0 h-full bg-pure-white box-custom p-6 shadow-card overflow-hidden">
            <h2 className="text-base font-bold mb-4 shrink-0">여행 지도</h2>
            <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-3xl overflow-hidden relative p-2">
              <NaverMapContainer
                places={mapPlaces}
                centerLat={getRegionCenter(scheduleMeta.region).lat}
                centerLng={getRegionCenter(scheduleMeta.region).lng}
              />
            </div>
          </div>

          {/* ✅ 우측: 탭 헤더 + 탭 콘텐츠 */}
          <div className="w-1/2 flex flex-col h-full overflow-hidden">
            {/* 탭 헤더 */}
            <div className="shrink-0 bg-pure-white box-custom p-4 shadow-card border border-slate-100 mb-4">
              <ScheduleHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
              />
            </div>
            {/* 탭 콘텐츠 */}
            <div className="flex-1 h-0 overflow-hidden">
              {activeTab === "timeline" && (
                <TimelineSection
                  userId={currentUser.id}
                  scheduleId={scheduleId}
                  isEditing={isEditing}
                  onPlaceAdded={handlePlaceAdded}
                />
              )}
              {activeTab === "account" && (
                <AccountBookSection
                  userId={currentUser.id}
                  scheduleId={scheduleId}
                />
              )}
              {activeTab === "companion" && (
                <CompanionSection userId={currentUser.id} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * 지역명으로 네이버 지도 기본 중심 좌표를 반환합니다.
 * schedule_places 테이블에 lat/lng 컬럼을 추가하면 이 함수 대신 실제 좌표를 사용하세요.
 */
function getRegionCenter(region: string): { lat: number; lng: number } {
  const centers: Record<string, { lat: number; lng: number }> = {
    서울특별시: { lat: 37.5665, lng: 126.978 },
    부산광역시: { lat: 35.1796, lng: 129.0756 },
    제주특별자치도: { lat: 33.4996, lng: 126.5312 },
    강원특별자치도: { lat: 37.8228, lng: 128.1555 },
    경상북도: { lat: 36.4919, lng: 128.8889 },
    인천광역시: { lat: 37.4563, lng: 126.7052 },
    대구광역시: { lat: 35.8714, lng: 128.6014 },
    광주광역시: { lat: 35.1595, lng: 126.8526 },
    대전광역시: { lat: 36.3504, lng: 127.3845 },
    울산광역시: { lat: 35.5384, lng: 129.3114 },
    경기도: { lat: 37.4138, lng: 127.5183 },
    충청북도: { lat: 36.8, lng: 127.7 },
    충청남도: { lat: 36.5184, lng: 126.8 },
    전라북도: { lat: 35.7175, lng: 127.153 },
    전라남도: { lat: 34.8679, lng: 126.991 },
    경상남도: { lat: 35.4606, lng: 128.2132 },
  };
  return centers[region] ?? { lat: 36.5, lng: 127.5 }; // 기본값: 한국 중부
}
