import "./App.css";
import { useState } from "react";
// 폴더 구조 설계 단계에서 계획한 페이지 컴포넌트들을 미리 임포트합니다.
// (아직 파일들을 만들지 않았다면 에러가 날 수 있으니 임시로 아래에 더미 컴포넌트를 만들어 두었습니다.)
import LoginPage from "./components/pages/auth/LoginPage";
import DashboardPage from "./components/pages/dashboard/DashboardPage";
import MyMapPage from "./components/pages/mymap/MyMapPage";
import HandleSchedulePage from "./components/pages/schedule/HandleSchedulePage";

export default App;
function App() {
  // 현재 어떤 페이지를 보여줄지 제어하는 상태 (기본값: 'login')
  // 'login' | 'dashboard' | 'mymap' | 'schedule'
  const [currentPage, setCurrentPage] = useState<string>("login");

  // 페이지 이동을 쉽게 도와주는 함수
  const navigateTo = (pageName: string) => {
    setCurrentPage(pageName);
  };

  // 현재 상태(currentPage)에 따라 해당 페이지 컴포넌트를 리턴하는 로직
  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <LoginPage onNavigate={navigateTo} />;
      case "dashboard":
        return <DashboardPage onNavigate={navigateTo} />;
      case "mymap":
        return <MyMapPage onNavigate={navigateTo} />;
      case "schedule":
        return <HandleSchedulePage onNavigate={navigateTo} />;
      default:
        return <LoginPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="App min-h-screen bg-base-100 font-sans">
      {/* 상태에 따라 바뀌는 페이지가 여기에 렌더링됩니다 */}
      {renderPage()}

      {/* 과제 개발 및 시연 편의용 테스트 내비게이터 바 (나중에 지우셔도 됩니다) */}
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
          onClick={() => navigateTo("schedule")}
          className="btn btn-xs btn-primary text-white"
        >
          일정편집
        </button>
      </div>
    </div>
  );
}
