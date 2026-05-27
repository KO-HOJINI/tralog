// MyMapPage.tsx 풀코드
import { useState, useEffect, useCallback } from "react";
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
  images: string[];
  coverImage?: string;
}

export default function MyMapPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [currentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [mapRecords, setMapRecords] = useState<MapRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 🛠️ fetchMapRecords 함수 정의
  const fetchMapRecords = useCallback(async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/map/records/${currentUser.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setMapRecords(data);
      }
    } catch (error) {
      console.error("지도 레코드 연동 에러:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 🛠️ 해결 지점: setTimeout(..., 0)을 활용하여 브라우저 렌더링 페인트가 끝난 후 비동기로 실행 유도
  useEffect(() => {
    if (!currentUser) {
      onNavigate("login");
      return;
    }

    const delayFetch = setTimeout(() => {
      fetchMapRecords();
    }, 0);

    return () => clearTimeout(delayFetch); // 컴포넌트 언마운트 시 타이머 클리어로 메모리 누수 방지
  }, [currentUser, fetchMapRecords, onNavigate]);

  const handleLogout = () => {
    localStorage.removeItem("tralog_current_user");
    onNavigate("login");
  };

  if (!currentUser || loading) return null;

  return (
    <div className="flex-col-full h-screen bg-background antialiased text-dark">
      <NavBar
        userName={currentUser.name}
        onNavigate={onNavigate}
        onLogout={handleLogout}
      />

      <main className="flex-1 h-0 w-[70%] mx-auto py-6 flex flex-row gap-8 items-stretch overflow-hidden">
        {/* 좌측 섹션 : 나만의 지도 채우기 */}
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

        {/* 우측 섹션 : 히스토리 목록 OR 상세 사진 보기 */}
        <div className="w-1/2 flex flex-col h-full overflow-hidden">
          {selectedRegion === null ? (
            <MyMapHistory
              onSelectRegion={setSelectedRegion}
              onNavigate={onNavigate}
            />
          ) : (
            <PhotoGrid
              regionName={selectedRegion}
              onBack={() => {
                setSelectedRegion(null);
                // 뒤로가기 시 갱신할 때도 타이머 스케줄러로 렌더링 충돌 회피
                setTimeout(() => {
                  fetchMapRecords();
                }, 0);
              }}
              mapRecords={mapRecords}
              onRefresh={fetchMapRecords}
            />
          )}
        </div>
      </main>
    </div>
  );
}
