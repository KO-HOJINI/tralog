// DashboardPage.tsx
import { useState, useEffect } from "react";
import NavBar from "../../Navbar";
import MapOverview from "./MapOverview";
import ScheduleList from "./ScheduleList";

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

interface UserSession {
  id: string;
  name: string;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

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
    <div className="h-screen bg-background flex flex-col font-sans antialiased text-dark overflow-hidden">
      {/* 상단 내비게이션 바 (창 너비의 80%) */}
      <NavBar
        userName={currentUser.name}
        onNavigate={onNavigate}
        onLogout={handleLogout}
      />

      {/* 본문 영역: 창 너비의 정확히 70% 설정 (max-w 제한을 없애 큰 모니터에서도 70% 유지) */}
      <main className="flex-1 h-0 w-[70%] mx-auto py-6 flex flex-row gap-8 items-stretch overflow-hidden">
        
        {/* 🗺️ 왼쪽 지도 Column (너비 제한을 풀고 비율 유지) */}
        <div className="w-[40%] min-w-[280px] flex flex-col shrink-0 h-full">
          <MapOverview userId={currentUser.id} onNavigate={onNavigate} />
        </div>

        {/* 📅 나의 여행 일정 Column (나머지 공간을 꽉 채우도록 flex-1 설정) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ScheduleList userId={currentUser.id} onNavigate={onNavigate} />
        </div>
      </main>
    </div>
  );
}