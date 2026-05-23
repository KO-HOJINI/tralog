import { useState, useEffect } from "react";
import NavBar from "../../Navbar";
import ScheduleHeader from "./ScheduleHeader";
import TimelineSection from "./TimelineSection";
import AccountBookSection from "./AccountBookSection";
import CompanionSection from "./CompanionSection";

interface HandleSchedulePageProps {
  onNavigate: (page: string) => void;
}

interface UserSession {
  id: string;
  name: string;
}

export default function HandleSchedulePage({
  onNavigate,
}: HandleSchedulePageProps) {
  // 1. 컴포넌트 평가와 동시에 동기화하여 useEffect 경고 차단
  const [currentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  const [activeTab, setActiveTab] = useState<string>("timeline");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [scheduleMeta] = useState({
    title: "제주도 협재 힐링 여행",
    period: "2026-06-15 ~ 2026-06-18",
  });

  // 2. 외부 상태 연동 흐름에 따른 안전한 사후 라우팅 처리
  useEffect(() => {
    if (!currentUser) {
      onNavigate("login");
    }
  }, [currentUser, onNavigate]);

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

      <main className="flex-1 h-0 max-w-6xl w-full mx-auto px-16 py-6 flex flex-col gap-4 overflow-hidden">
        <div className="flex justify-between items-end border-b border-slate-200/60 pb-3 shrink-0 select-none">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-black tracking-tight text-dark">
              {scheduleMeta.title}
            </h1>
            <span className="text-xs font-bold text-primary bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/40">
              {scheduleMeta.period}
            </span>
          </div>
          <button
            onClick={() => onNavigate("dashboard")}
            className="text-xs font-bold text-gray hover:text-dark transition-colors"
          >
            ← 대시보드로 돌아가기
          </button>
        </div>

        <div className="flex-1 h-0 flex flex-row gap-8 items-stretch overflow-hidden">
          <div className="w-[45%] flex flex-col h-full shrink-0">
            <div className="box-custom flex-1 bg-pure-white border border-slate-100 overflow-hidden relative flex flex-col p-4">
              <div className="w-full h-full rounded-2xl bg-[#E2E8F0]/40 border border-slate-200/60 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[16px_16px] opacity-60" />
                <div className="z-10 bg-pure-white px-5 py-2.5 rounded-full shadow-custom border border-slate-100 text-center select-none">
                  <span className="text-xs font-black text-dark tracking-wider">
                    NAVER MAP API CONTAINER
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col h-full gap-4 overflow-hidden">
            <ScheduleHeader
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
            />

            <div className="flex-1 h-0 overflow-hidden">
              {activeTab === "timeline" && (
                <TimelineSection
                  userId={currentUser.id}
                  isEditing={isEditing}
                />
              )}
              {activeTab === "account" && (
                <AccountBookSection userId={currentUser.id} />
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
