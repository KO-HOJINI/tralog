import "./App.css";
import { useState } from "react";
import LoginPage from "./components/pages/auth/LoginPage";
import DashboardPage from "./components/pages/dashboard/DashboardPage";
import MyMapPage from "./components/pages/mymap/MyMapPage";
import HandleSchedulePage from "./components/pages/schedule/HandleSchedulePage";

function App() {
  const [currentPage, setCurrentPage] = useState<string>("login");

  // ✅ Fix: scheduleId를 받아서 localStorage에 저장 후 페이지 이동
  // "schedule" 페이지로 이동하면 새 일정이므로 localStorage를 초기화
  const navigateTo = (pageName: string, scheduleId?: string) => {
    if (scheduleId) {
      localStorage.setItem("tralog_active_schedule_id", scheduleId);
    } else if (pageName === "schedule") {
      localStorage.removeItem("tralog_active_schedule_id");
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
      // ✅ Fix: "schedule"과 "handleschedule" 둘 다 HandleSchedulePage로 연결
      case "schedule":
      case "handleschedule":
        return <HandleSchedulePage onNavigate={navigateTo} />;
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
