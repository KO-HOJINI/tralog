// DashboardPage.tsx - 메인 대시보드 페이지
// 로그인 사용자의 지도 현황 + 여행 일정 목록 표시
// localStorage에서 로그인 세션 확인, 없으면 로그인 페이지로 이동

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
  // localStorage 세션을 초기값으로 설정
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  // 세션 없으면 로그인 페이지로 이동
  useEffect(() => {
    if (!currentUser) {
      onNavigate("login");
    }
  }, [currentUser, onNavigate]);

  // 로그아웃 - 세션 제거 후 로그인 페이지로
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
