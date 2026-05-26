import { useState, useEffect } from "react";
import NavBar from "../../Navbar";
import InteractiveMap from "./InteractiveMap";
import MyMapHistory from "./MyMapHistory";
import PhotoGrid from "./PhotoGrid";

interface UserSession {
  id: string;
  name: string;
}

export interface MapRecord {
  region: string;
  images: string[]; // 업로드된 이미지들의 Base64 데이터 스트링 배열
  coverImage?: string; // 유저가 대표사진으로 선택한 이미지
}

export default function MyMapPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // 에러 해결: useState Lazy Initialization을 사용하여 초기 렌더링 시점에 안전하게 가져옵니다.
  const [mapRecords, setMapRecords] = useState<MapRecord[]>(() => {
    if (!currentUser) return [];
    const stored = localStorage.getItem(`tralog_map_${currentUser.id}`);
    return stored ? JSON.parse(stored) : [];
  });

  // 세션이 없는 경우의 페이지 팅겨내기(네비게이션) 동기화만 useEffect에 남겨둡니다.
  useEffect(() => {
    if (!currentUser) {
      onNavigate("login");
    }
  }, [currentUser, onNavigate]);

  // 데이터 변경 시 localStorage 자동 업데이트
  const saveRecords = (updated: MapRecord[]) => {
    if (!currentUser) return;
    setMapRecords(updated);
    localStorage.setItem(
      `tralog_map_${currentUser.id}`,
      JSON.stringify(updated),
    );
  };

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
        {/* 좌측 섹션 (50%) : 나만의 지도 채우기 */}
        <div className="w-1/2 flex flex-col shrink-0 h-full bg-pure-white box-custom p-6 shadow-card overflow-hidden">
          <h2 className="mb-4">나만의 지도 채우기</h2>
          <div className="flex-1 flex items-center justify-center bg-slate-50/50 border border-slate-100 rounded-3xl p-4 overflow-hidden">
            <InteractiveMap
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              mapRecords={mapRecords}
            />
          </div>
        </div>

        {/* 우측 섹션 (50%) : 기록 목록 OR 상세 사진 보기 */}
        <div className="w-1/2 flex flex-col h-full overflow-hidden">
          {selectedRegion === null ? (
            <MyMapHistory
              onSelectRegion={setSelectedRegion}
              onNavigate={onNavigate}
            />
          ) : (
            <PhotoGrid
              regionName={selectedRegion}
              onBack={() => setSelectedRegion(null)}
              mapRecords={mapRecords}
              onSaveRecords={saveRecords}
            />
          )}
        </div>
      </main>
    </div>
  );
}
