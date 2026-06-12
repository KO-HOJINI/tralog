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
import { getRegionCenter } from "../../../config/regions";

interface HandleSchedulePageProps {
  onNavigate: (page: string) => void;
  scheduleId?: string;
}

export default function HandleSchedulePage({
  onNavigate,
  scheduleId: scheduleIdProp,
}: HandleSchedulePageProps) {
  // 로그인 유저 세션 (localStorage 초기값)
  const [currentUser] = useState(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  // props ID가 없으면 localStorage에서 가져옴
  const [scheduleId] = useState(
    () =>
      scheduleIdProp ||
      localStorage.getItem("tralog_active_schedule_id") ||
      "s-1",
  );

  const [activeTab, setActiveTab] = useState<string>("timeline"); // 현재 활성 탭 (타임라인/가계부/일행)

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
    handlePlaceUpdated,
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
                onPlaceUpdated={handlePlaceUpdated}
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
