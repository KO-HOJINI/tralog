// HandleSchedulePage.tsx - 일정 편집 페이지
// 좌측: 네이버 지도, 우측: 타임라인/가계부/일행 탭
// 데이터 로직은 useSchedule 훅으로 분리

import { useState } from "react";
import NavBar from "../../Navbar";
import ScheduleHeader from "./header/ScheduleHeader";
import TimelineSection from "./timeline/TimelineSection";
import AccountBookSection from "./account/AccountBookSection";
import CompanionSection from "./CompanionSection";
import NaverMapContainer from "./NaverMapContainer";
import { useSchedule } from "./hooks/useSchedule";

interface HandleSchedulePageProps {
  onNavigate: (page: string) => void;
  scheduleId?: string;
}

export default function HandleSchedulePage({
  onNavigate,
  scheduleId: scheduleIdProp,
}: HandleSchedulePageProps) {
  const [currentUser] = useState(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  // props ID가 없으면 localStorage에서 가져옴
  const [scheduleId] = useState(
    () => scheduleIdProp || localStorage.getItem("tralog_active_schedule_id") || "s-1",
  );

  const [activeTab, setActiveTab] = useState<string>("timeline");

  const {
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
  } = useSchedule(scheduleId, currentUser, onNavigate);

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

      <main className="flex-1 h-0 w-[70%] mx-auto py-6 flex flex-col overflow-hidden">
        {/* 상단: 일정 제목/날짜 (편집 모드면 입력 가능) + 헤더 버튼 영역 */}
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
                  <span className="text-[14px] font-bold text-slate-700 tracking-wide mt-1">
                    {scheduleMeta.period}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex-1 shrink-0">
            <ScheduleHeader
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isEditing={isEditing}
              canEdit={canEdit}
              onToggleEdit={handleToggleEdit}
              onNavigate={onNavigate}
              scheduleId={scheduleId}
              scheduleRegion={scheduleMeta.region}
              onChangeRegion={handleChangeRegion}
              onDeleteSchedule={handleDeleteSchedule}
            />
          </div>
        </div>

        {/* 하단: 좌측 지도 + 우측 탭 섹션 */}
        <div className="flex-1 h-0 flex w-full gap-5 items-stretch overflow-hidden">
          <div className="flex-1 shrink-0 h-full box-white p-2 overflow-hidden">
            {scheduleMeta.region ? (
              <NaverMapContainer
                places={mapPlaces}
                centerLat={getRegionCenter(scheduleMeta.region).lat}
                centerLng={getRegionCenter(scheduleMeta.region).lng}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
                지도를 매핑하고 있습니다...
              </div>
            )}
          </div>

          <div className="flex-1 h-full box-white overflow-hidden flex flex-col">
            {activeTab === "timeline" && (
              <TimelineSection
                userId={currentUser.id}
                scheduleId={scheduleId}
                isEditing={isEditing}
                startDate={scheduleMeta.start_date}
                endDate={scheduleMeta.end_date}
                region={scheduleMeta.region}
                onPlaceAdded={handlePlaceAdded}
                onPlaceDeleted={handlePlaceDeleted}
              />
            )}
            {activeTab === "account" && (
              <AccountBookSection
                scheduleId={scheduleId}
                canEdit={canEdit}
                startDate={scheduleMeta.start_date}
                endDate={scheduleMeta.end_date}
              />
            )}
            {activeTab === "companion" && (
              <CompanionSection
                userId={currentUser.id}
                scheduleId={scheduleId}
                scheduleTitle={scheduleMeta.title}
                schedulePeriod={scheduleMeta.period}
                canEdit={canEdit}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// 지역명 -> 지도 중심 좌표 반환
function getRegionCenter(region: string): { lat: number; lng: number } {
  const centers: Record<string, { lat: number; lng: number }> = {
    서울특별시: { lat: 37.5665, lng: 126.978 },
    부산광역시: { lat: 35.1796, lng: 129.0756 },
    대구광역시: { lat: 35.8714, lng: 128.6014 },
    인천광역시: { lat: 37.4563, lng: 126.7052 },
    광주광역시: { lat: 35.1595, lng: 126.8526 },
    대전광역시: { lat: 36.3504, lng: 127.3845 },
    울산광역시: { lat: 35.5384, lng: 129.3114 },
    세종특별자치시: { lat: 36.4801, lng: 127.289 },
    경기도: { lat: 37.2752, lng: 127.0095 },
    강원도: { lat: 37.751853, lng: 128.876057 },
    강원특별자치도: { lat: 37.751853, lng: 128.876057 },
    충청북도: { lat: 36.6357, lng: 127.4917 },
    충청남도: { lat: 36.4599, lng: 127.126 },
    전라북도: { lat: 35.8242, lng: 127.148 },
    전북특별자치도: { lat: 35.8242, lng: 127.148 },
    전라남도: { lat: 34.7604, lng: 127.6622 },
    경상북도: { lat: 35.856171, lng: 129.224748 },
    경상남도: { lat: 34.8544, lng: 128.4331 },
    제주도: { lat: 33.4996, lng: 126.5312 },
    제주특별자치도: { lat: 33.4996, lng: 126.5312 },
  };
  return centers[region] ?? { lat: 37.5665, lng: 126.978 };
}
