// Navbar.tsx
interface NavBarProps {
  userName: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function NavBar({
  userName,
  onNavigate,
  onLogout,
}: NavBarProps) {
  return (
    <div className="w-full pt-6 sticky top-0 z-50">
      {/* header의 max-w 제한을 제거하여 큰 모니터에서도 무조건 창 크기의 80%를 유지 */}
      <header className="w-[80%] mx-auto h-18 bg-white border border-slate-100 rounded-4xl px-10 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* 로고 */}
        <span
          onClick={() => onNavigate("dashboard")}
          className="tracking-tight cursor-pointer select-none"
        >
          <p className="text-logo">Tralog</p>
        </span>

        {/* 사용자 정보, 로그아웃 */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-1.5 select-none">
            <h3>{userName}</h3>
            <p className="text-body-main">여행자님</p>
          </div>

          {/* 로그아웃 */}
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