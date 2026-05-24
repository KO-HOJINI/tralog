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
    <div className="flex-col-full h-screen bg-background antialiased text-dark">
      <NavBar
        userName={currentUser.name}
        onNavigate={onNavigate}
        onLogout={handleLogout}
      />

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
