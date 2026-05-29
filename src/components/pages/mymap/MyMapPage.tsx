// ===================================================
// MyMapPage.tsx - 나만의 지도 페이지
//
// 좌측: 한국 지도 (지역 선택 가능)
// 우측: 지역 미선택 → 히스토리 목록 / 선택 → 사진 그리드
//
// 백엔드 API: GET /api/map/records/:userId
//
// AI 도움:
//   - useCallback으로 fetchMapRecords 함수 메모이제이션
//   - setTimeout(..., 0) 으로 브라우저 렌더 페인트 후 비동기 실행 유도
//     (바로 fetch하면 컴포넌트 렌더 중 상태 업데이트 충돌 가능성 있음)
// ===================================================

import { useState, useEffect, useCallback } from "react";
import NavBar from "../../Navbar";
import InteractiveMap from "./InteractiveMap";
import MyMapHistory from "./MyMapHistory";
import PhotoGrid from "./PhotoGrid";

interface UserSession {
  id: string;
  name: string;
}

// 지도 기록 타입 (외부에서도 import해서 씀)
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

  // AI 도움: useCallback으로 감싸서 불필요한 재생성 방지
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

  useEffect(() => {
    if (!currentUser) {
      onNavigate("login");
      return;
    }

    // AI 도움: setTimeout으로 렌더링 충돌 방지
    const delayFetch = setTimeout(() => {
      fetchMapRecords();
    }, 0);

    return () => clearTimeout(delayFetch); // 언마운트 시 타이머 정리
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

        {/* 좌측: 지도 */}
        <div className="w-1/2 flex flex-col shrink-0 h-full box-white p-6 shadow-card overflow-hidden">
          <h2 className="mb-4">나만의 지도 채우기</h2>
          <div className="flex-1 flex items-center justify-center bg-slate-50/50 border border-slate-100 rounded-3xl p-4 overflow-hidden">
            <InteractiveMap
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              mapRecords={mapRecords}
            />
          </div>
        </div>

        {/* 우측: 히스토리 목록 or 사진 상세 */}
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
                // 뒤로가기 시 최신 데이터 다시 불러옴
                setTimeout(() => { fetchMapRecords(); }, 0);
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
