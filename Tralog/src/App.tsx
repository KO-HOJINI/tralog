// App.tsx - 루트 컴포넌트
// React Router 없이 useState로 페이지 전환 처리
// 브라우저 뒤로가기 지원을 위해 History API(pushState/popstate) 연동 (※ AI 도움)

import "./styles/App.css";
import { useState, useEffect } from "react";
import LoginPage from "./components/pages/auth/LoginPage";
import DashboardPage from "./components/pages/dashboard/DashboardPage";
import MyMapPage from "./components/pages/mymap/MyMapPage";
import HandleSchedulePage from "./components/pages/schedule/HandleSchedulePage";

function App() {
  // URL 해시(#)에서 현재 페이지 읽어 초기값 설정 (새로고침해도 유지)
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const hash = window.location.hash.replace("#", "");
    return hash || "login";
  });

  // 현재 편집 중인 일정 ID
  const [activeScheduleId, setActiveScheduleId] = useState<string | undefined>(
    () => localStorage.getItem("tralog_active_schedule_id") || undefined,
  );

  // 브라우저 뒤로가기/앞으로가기 버튼과 앱 상태 동기화 (※ AI 도움)
  // History API의 pushState/replaceState + popstate 이벤트 활용
  useEffect(() => {
    window.history.replaceState(
      { page: currentPage, scheduleId: activeScheduleId },
      "",
      `#${currentPage}`
    );

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.scheduleId) {
          setActiveScheduleId(event.state.scheduleId);
          localStorage.setItem("tralog_active_schedule_id", event.state.scheduleId);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentPage, activeScheduleId]);

  // 페이지 이동 - 페이지명과 일정 ID를 받아 화면 전환
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
    // 주소창 해시도 변경해 뒤로가기 히스토리에 기록
    window.history.pushState(
      { page: pageName, scheduleId: nextScheduleId },
      "",
      `#${pageName}`
    );
  };

  // 현재 페이지에 맞는 컴포넌트 렌더링
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
      {/* 개발 테스트용 빠른 이동 버튼 (제출 전 제거 예정) */}
      {/* 
      <div className="fixed bottom-4 right-4 bg-neutral text-neutral-content p-2 rounded-xl shadow-custom text-xs flex gap-2 z-50 opacity-50 hover:opacity-100 transition-opacity">
        <span className="font-bold self-center">test:</span>
        <button onClick={() => navigateTo("login")} className="btn-primary px-3 py-1 text-xs">로그인</button>
        <button onClick={() => navigateTo("dashboard")} className="btn-primary px-3 py-1 text-xs">대시보드</button>
        <button onClick={() => navigateTo("mymap")} className="btn-primary px-3 py-1 text-xs">나만의지도</button>
        <button onClick={() => navigateTo("handleschedule")} className="btn-primary px-3 py-1 text-xs">일정편집</button>
      </div> 
      */}
    </div>
  );
}

export default App;
