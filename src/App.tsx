import "./App.css";
import { useState } from "react";
import LoginPage from "./components/pages/auth/LoginPage";
import DashboardPage from "./components/pages/dashboard/DashboardPage";
import MyMapPage from "./components/pages/mymap/MyMapPage";
import HandleSchedulePage from "./components/pages/schedule/HandleSchedulePage";

function App() {
  const [currentPage, setCurrentPage] = useState<string>("login");

  // ✅ 상태로 활성화된 일정 ID를 관리하여 변경 시 리렌더링을 유도
  const [activeScheduleId, setActiveScheduleId] = useState<string | undefined>(
    () => localStorage.getItem("tralog_active_schedule_id") || undefined,
  );

  const navigateTo = (pageName: string, scheduleId?: string) => {
    if (scheduleId) {
      localStorage.setItem("tralog_active_schedule_id", scheduleId);
      setActiveScheduleId(scheduleId);
    } else if (pageName === "schedule" || pageName === "handleschedule") {
      const localId = localStorage.getItem("tralog_active_schedule_id");
      if (localId) setActiveScheduleId(localId);
    }
    setCurrentPage(pageName);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <LoginPage onNavigate={navigateTo} />;
      case "dashboard":
        return <DashboardPage onNavigate={navigateTo} />;
      case "mymap":
        return <MyMapPage onNavigate={navigateTo} />;
      case "schedule":
      case "handleschedule":
        // ✅ key prop에 ID를 넘겨주어, ID가 바뀌면 컴포넌트가 강제로 새로 마운트되도록 수정
        return (
          <HandleSchedulePage
            key={activeScheduleId || "new"}
            scheduleId={activeScheduleId}
            onNavigate={navigateTo}
          />
        );
      default:
        return <LoginPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="App min-h-screen bg-base-100 font-sans">
      {renderPage()}

      {/* 개발용 테스트 네비게이터 */}
      <div className="fixed bottom-4 right-4 bg-neutral text-neutral-content p-2 rounded-xl shadow-custom text-xs flex gap-2 z-50 opacity-50 hover:opacity-100 transition-opacity">
        <span className="font-bold self-center">test:</span>
        <button
          onClick={() => navigateTo("login")}
          className="btn btn-xs btn-primary text-white"
        >
          로그인
        </button>
        <button
          onClick={() => navigateTo("dashboard")}
          className="btn btn-xs btn-primary text-white"
        >
          대시보드
        </button>
        <button
          onClick={() => navigateTo("mymap")}
          className="btn btn-xs btn-primary text-white"
        >
          나만의지도
        </button>
        <button
          onClick={() => navigateTo("handleschedule")}
          className="btn btn-xs btn-primary text-white"
        >
          일정편집
        </button>
      </div>
    </div>
  );
}

export default App;
