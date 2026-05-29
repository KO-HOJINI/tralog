// ===================================================
// DashboardPage.tsx - 메인 대시보드 페이지
//
// 로그인된 유저의 지도 현황 + 여행 일정 목록을 보여줌
// localStorage에서 세션 불러옴 (없으면 로그인 페이지로 redirect)
// ===================================================

import { useState, useEffect } from "react";
import NavBar from "../../Navbar";
import MapOverview from "./MapOverview";
import ScheduleList from "./ScheduleList";

interface DashboardPageProps {
  onNavigate: (page: string, scheduleId?: string) => void;
}

interface UserSession {
  id: string;
  name: string;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  // localStorage에서 세션 초기값으로 설정
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  // 로그인 안 됐으면 로그인 페이지로 보냄
  useEffect(() => {
    if (!currentUser) {
      onNavigate("login");
    }
  }, [currentUser, onNavigate]);

  const handleLogout = () => {
    localStorage.removeItem("tralog_current_user");
    setCurrentUser(null);
    onNavigate("login");
  };

  if (!currentUser) return null;

  return (
    <div className="flex-col-full h-screen bg-background antialiased text-dark">
      <NavBar
        userName={currentUser.name}
        onNavigate={onNavigate}
        onLogout={handleLogout}
      />

      {/* 좌: 지도 / 우: 일정 목록 */}
      <main className="flex-1 h-0 w-[70%] mx-auto py-6 flex flex-row gap-8 items-stretch overflow-hidden">
        <div className="w-[40%] min-w-70 flex flex-col shrink-0 h-full">
          <MapOverview userId={currentUser.id} onNavigate={onNavigate} />
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ScheduleList userId={currentUser.id} onNavigate={onNavigate} />
        </div>
      </main>
    </div>
  );
}
