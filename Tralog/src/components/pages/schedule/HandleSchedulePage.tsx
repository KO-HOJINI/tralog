// ===================================================
// HandleSchedulePage.tsx - 일정 편집 메인 페이지
//
// 백엔드 API:
//   GET /api/schedules/:id  → 일정 메타 + places + expenses
//   PUT /api/schedules/:id  → 일정 제목/기간 수정
//
// 피그마 디자인 반영:
//   - 상단: 제목(좌) + 알약 탭 메뉴(우) 레이아웃
//   - 좌: 네이버 지도 (box-white)
//   - 우: 탭별 콘텐츠 패널 (box-white)
//   - 편집 모드: 인라인 제목/날짜 수정 폼
//
// AI 도움:
//   - useCallback으로 fetchScheduleData 메모이제이션
//   - PlaceMarker 타입 정의 + mapPlaces 상태 관리
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

  // prop으로 못 받으면 localStorage에서 꺼냄
  const [scheduleId] = useState<string>(
    () =>
      scheduleIdProp ||
      localStorage.getItem("tralog_active_schedule_id") ||
      "s-1",
  );

  const [activeTab, setActiveTab] = useState<string>("timeline");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 편집 모드 인풋 상태
  const [editTitle, setEditTitle] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const [scheduleMeta, setScheduleMeta] = useState<ScheduleMeta>({
    title: "로딩 중...",
    period: "",
    region: "",
  });

  const [mapPlaces, setMapPlaces] = useState<PlaceMarker[]>([]);

  // 일정 데이터 불러오기
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

      // 지도 마커용 장소 목록
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
      console.error("일정 데이터 로딩 오류:", err);
    }
  }, [scheduleId]);

  useEffect(() => {
    const init = async () => {
      if (!currentUser) {
        onNavigate("login");
        return;
      }
      await fetchScheduleData();
    };
    void init();
  }, [currentUser, onNavigate, fetchScheduleData]);

  // 편집 모드 on/off
  const toggleEditMode = (mode: boolean) => {
    if (mode) {
      setEditTitle(scheduleMeta.title);
      setEditStartDate(scheduleMeta.start_date || "");
      setEditEndDate(scheduleMeta.end_date || "");
    }
    setIsEditing(mode);
  };

  // 일정 메타 정보 저장
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
        alert("일정 정보 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("일정 수정 오류:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  // 타임라인에서 장소 추가 시 지도에도 마커 추가
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

      <main className="flex-1 h-0 w-[70%] max-w-7xl mx-auto py-6 flex flex-col gap-5 overflow-hidden">
        {/* 상단: 일정 제목(좌) + 탭 메뉴(우) */}
        <div className="flex justify-between shrink-0 pl-1">
          {/* 좌측: 일정 제목 + 기간 */}
          <div className="w-1/2 flex flex-col gap-1.5">
            {isEditing ? (
              /* 편집 모드: 인라인 제목/날짜 수정 폼 */
              <div className="w-[90%] flex gap-2 items-center box-white p-2.5 border border-slate-200 shadow-card">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="여행 제목 입력"
                  className="w-[35%] text-xl font-black text-dark input-custom px-3 py-1 focus:outline-none"
                />
                <div className="w-[40%] flex items-center input-custom px-5 py-2.5">
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="text-xs font-bold text-slate-600 bg-transparent focus:outline-none"
                  />
                  <span className="text-slate-400 text-xs">~</span>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="text-xs font-bold text-slate-600 bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleUpdateMeta}
                  className="btn-primary px-4 py-1.5 text-xs"
                >
                  확인
                </button>
                <button
                  onClick={() => toggleEditMode(false)}
                  className="btn-ghost px-4 py-1.5 text-xs"
                >
                  취소
                </button>
              </div>
            ) : (
              /* 일반 모드: 제목 + 기간 텍스트 */
              <>
                <h1 className="text-[26px] font-black tracking-tight text-dark m-0 leading-none">
                  {scheduleMeta.title}
                </h1>
                {scheduleMeta.period && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-sm font-bold text-slate-600 tracking-wide">
                      {scheduleMeta.period}
                    </span>
                    {/* 편집 힌트 아이콘 */}
                    <span className="text-[10px] grayscale opacity-60 ml-0.5">
                      ✏️
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 우측: 알약 탭 메뉴 */}
          <div className="w-1/2  flex flex-col gap-1.5 shrink-0">
            <ScheduleHeader
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isEditing={isEditing}
              onToggleEdit={() => toggleEditMode(!isEditing)}
              onNavigate={onNavigate}
            />
          </div>
        </div>

        {/* 하단 메인 콘텐츠 */}
        <div className="flex-1 h-0 flex flex-row gap-5 items-stretch overflow-hidden">
          {/* 좌측: 네이버 지도 */}
          <div className="w-1/2 shrink-0 h-full box-white border border-slate-100 shadow-card p-2 overflow-hidden">
            <NaverMapContainer
              places={mapPlaces}
              centerLat={getRegionCenter(scheduleMeta.region).lat}
              centerLng={getRegionCenter(scheduleMeta.region).lng}
            />
          </div>

          {/* 우측: 탭별 콘텐츠 */}
          <div className="w-1/2 h-full box-white border border-slate-100 shadow-card overflow-hidden">
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

// 지역명 → 지도 중심 좌표 변환
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
