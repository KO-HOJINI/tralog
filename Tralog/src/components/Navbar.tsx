// ===================================================
// Navbar.tsx - 상단 고정 네비게이션 바
//
// sticky top-0으로 스크롤해도 항상 상단에 고정됨
// 80% 너비로 가운데 정렬 (큰 모니터도 커버)
// ===================================================

interface NavBarProps {
  userName: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function NavBar({ userName, onNavigate, onLogout }: NavBarProps) {
  return (
    <div className="w-full pt-6 sticky top-0 z-50">
      <header className="w-[80%] mx-auto h-18 box-white px-10 flex items-center justify-between shadow-custom">

        {/* 로고 클릭하면 대시보드로 이동 */}
        <span
          onClick={() => onNavigate("dashboard")}
          className="tracking-tight cursor-pointer select-none"
        >
          <p className="text-logo">Tralog</p>
        </span>

        {/* 우측: 유저 이름 + 로그아웃 */}
        <div className="flex items-center gap-10">
          {/* 유저 이름 표시 */}
          <div className="flex items-center gap-1.5 select-none">
            <h3>{userName}</h3>
            <p className="text-body-main">여행자님</p>
          </div>

          {/* 로그아웃 텍스트 버튼 */}
          <span
            onClick={onLogout}
            className="tracking-tight cursor-pointer select-none"
          >
            <h3>로그아웃</h3>
          </span>
        </div>
      </header>
    </div>
  );
}
