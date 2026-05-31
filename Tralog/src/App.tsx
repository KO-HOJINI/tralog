// ===================================================
// App.tsx - 루트 컴포넌트 (라우팅 담당)
//
// React Router 없이 useState로 페이지 전환 구현
// 💡 History API (pushState, popstate) 연동: 
//    브라우저 뒤로가기 버튼 지원 및 새로고침 시 페이지 유지
// ===================================================

import "./App.css";
import { useState, useEffect } from "react";
import LoginPage from "./components/pages/auth/LoginPage";
import DashboardPage from "./components/pages/dashboard/DashboardPage";
import MyMapPage from "./components/pages/mymap/MyMapPage";
import HandleSchedulePage from "./components/pages/schedule/HandleSchedulePage";

function App() {
  // 💡 초기 페이지를 URL의 해시(#) 값에서 읽어옴 (새로고침 방지)
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const hash = window.location.hash.replace("#", "");
    return hash || "login";
  });

  // 활성화된 일정 ID
  const [activeScheduleId, setActiveScheduleId] = useState<string | undefined>(
    () => localStorage.getItem("tralog_active_schedule_id") || undefined,
  );

  // 💡 브라우저 뒤로가기/앞으로가기 이벤트 감지
  useEffect(() => {
    // 앱이 처음 켜질 때 현재 상태를 브라우저 히스토리에 덮어씀
    window.history.replaceState(
      { page: currentPage, scheduleId: activeScheduleId },
      "",
      `#${currentPage}`
    );

    // 사용자가 브라우저 뒤로가기 버튼을 눌렀을 때 실행되는 함수
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page); // 이전 페이지로 상태 복구
        
        // 이전 페이지에 연결된 일정 ID가 있다면 함께 복구
        if (event.state.scheduleId) {
          setActiveScheduleId(event.state.scheduleId);
          localStorage.setItem("tralog_active_schedule_id", event.state.scheduleId);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentPage, activeScheduleId]);

  const navigateTo = (pageName: string, scheduleId?: string) => {
    let nextScheduleId = scheduleId;

    if (scheduleId) {
      localStorage.setItem("tralog_active_schedule_id", scheduleId);
      setActiveScheduleId(scheduleId);
    } else if (pageName === "schedule" || pageName === "handleschedule") {
      const localId = localStorage.getItem("tralog_active_schedule_id");
      if (localId) {
        setActiveScheduleId(localId);
        nextScheduleId = localId;
      }
    }
    
    setCurrentPage(pageName);

    // 💡 화면 전환 시 브라우저 방문 기록(History)에 추가 + 주소창 해시 변경
    window.history.pushState(
      { page: pageName, scheduleId: nextScheduleId },
      "",
      `#${pageName}`
    );
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