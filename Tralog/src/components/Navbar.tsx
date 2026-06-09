// Navbar.tsx - 상단 고정 내비게이션 바
// sticky top-0으로 스크롤해도 상단 고정
// 로고 클릭 시 대시보드 이동, 우측에 사용자 이름 + 로그아웃 버튼 배치

interface NavBarProps {
  userName: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function NavBar({ userName, onNavigate, onLogout }: NavBarProps) {
  return (
    <div className="w-full pt-6 sticky top-0 z-50">
      <header className="w-[80%] mx-auto h-18 box-white px-10 flex items-center justify-between">

        {/* 로고 - 클릭 시 대시보드 이동 */}
        <span
          onClick={() => onNavigate("dashboard")}
          className="tracking-tight cursor-pointer select-none"
        >
          <p className="text-logo">Tralog</p>
        </span>

        {/* 우측: 사용자 이름 + 로그아웃 버튼 */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-1.5 select-none">
            <h3>{userName}</h3>
            <p className="text-body-main">여행자님</p>
          </div>
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
