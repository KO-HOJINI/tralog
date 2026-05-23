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
      {/* 상단 내비게이션 바 */}
      <NavBar
        userName={currentUser.name}
        onNavigate={onNavigate}
        onLogout={handleLogout}
      />

      <main className="flex-1 h-0 max-w-6xl w-full mx-auto px-16 py-8 flex flex-row gap-8 items-stretch overflow-hidden">
        {/* 나만의 지도 컬렉션 Column */}
        <div className="w-[40%] flex flex-col shrink-0 h-full">
          <MapOverview userId={currentUser.id} onNavigate={onNavigate} />
        </div>

        {/* 나의 여행 일정 Column */}
        <div className="flex-1 flex flex-col h-full">
          <ScheduleList userId={currentUser.id} onNavigate={onNavigate} />
        </div>
      </main>
    </div>
  );
}
