// ===================================================
// App.tsx - 루트 컴포넌트 (라우팅 담당)
//
// React Router 없이 useState로 페이지 전환 구현함
// 실제 라우터 쓰면 더 좋은데 일단 이렇게 함
//
// scheduleId는 일정 편집 페이지로 이동할 때 같이 넘겨줌
// localStorage에도 저장해서 새로고침 후에도 유지됨
// ===================================================

import "./App.css";
import { useState } from "react";
import LoginPage from "./components/pages/auth/LoginPage";
import DashboardPage from "./components/pages/dashboard/DashboardPage";
import MyMapPage from "./components/pages/mymap/MyMapPage";
import HandleSchedulePage from "./components/pages/schedule/HandleSchedulePage";

function App() {
  const [currentPage, setCurrentPage] = useState<string>("login");

  // 활성화된 일정 ID - 변경 시 HandleSchedulePage 재마운트 유도
  const [activeScheduleId, setActiveScheduleId] = useState<string | undefined>(
    () => localStorage.getItem("tralog_active_schedule_id") || undefined,
  );

  const navigateTo = (pageName: string, scheduleId?: string) => {
    if (scheduleId) {
      // 일정 ID가 넘어오면 저장
      localStorage.setItem("tralog_active_schedule_id", scheduleId);
      setActiveScheduleId(scheduleId);
    } else if (pageName === "schedule" || pageName === "handleschedule") {
      // 일정 편집 페이지로 이동할 때 기존 ID 유지
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
        // key에 ID 넣어서 ID가 바뀌면 컴포넌트 강제 재마운트
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

      {/* 개발 테스트용 네비게이터 (배포 시 제거 필요) */}
      <div className="fixed bottom-4 right-4 bg-neutral text-neutral-content p-2 rounded-xl shadow-custom text-xs flex gap-2 z-50 opacity-50 hover:opacity-100 transition-opacity">
        <span className="font-bold self-center">test:</span>
        <button onClick={() => navigateTo("login")} className="btn-primary px-3 py-1 text-xs">
          로그인
        </button>
        <button onClick={() => navigateTo("dashboard")} className="btn-primary px-3 py-1 text-xs">
          대시보드
        </button>
        <button onClick={() => navigateTo("mymap")} className="btn-primary px-3 py-1 text-xs">
          나만의지도
        </button>
        <button onClick={() => navigateTo("handleschedule")} className="btn-primary px-3 py-1 text-xs">
          일정편집
        </button>
      </div>
    </div>
  );
}

export default App;
