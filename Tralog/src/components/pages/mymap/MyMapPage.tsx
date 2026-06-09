// MyMapPage.tsx - 나만의 지도 페이지
// 좌측: 한국 지도(지역 선택), 우측: 히스토리 목록 또는 사진 상세
//
// ※ AI 도움 - useCallback으로 fetchMapRecords 메모이제이션,
//   setTimeout(..., 0)으로 렌더링 충돌 방지 (렌더 도중 fetch 호출 시 상태 업데이트가
//   겹칠 수 있어, 렌더링 끝난 직후 실행되도록 처리)

import { useState, useEffect, useCallback } from "react";
import NavBar from "../../Navbar";
import InteractiveMap from "./InteractiveMap";
import MyMapHistory from "./MyMapHistory";
import PhotoGrid from "./PhotoGrid";
import { API_BASE_URL } from "../../../config/api";

interface UserSession {
  id: string;
  name: string;
}

// 지도 기록 타입 - 다른 파일에서도 사용
export interface MapRecord {
  region: string;
  images: string[];
  coverImage?: string;
}

export default function MyMapPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [currentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData) : null;
  });

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [mapRecords, setMapRecords] = useState<MapRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 지도 사진 기록 로드 - currentUser 바뀔 때만 함수 재생성 (※ AI 도움)
  const fetchMapRecords = useCallback(async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/map/records/${currentUser.id}`);
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

    // setTimeout(0)으로 렌더링 완료 직후 fetch 실행 (※ AI 도움)
    const delayFetch = setTimeout(() => { fetchMapRecords(); }, 0);
    return () => clearTimeout(delayFetch);
  }, [currentUser, fetchMapRecords, onNavigate]);

  const handleLogout = () => {
    localStorage.removeItem("tralog_current_user");
    onNavigate("login");
  };

  if (!currentUser) return null;

  return (
    <div className="flex-col-full h-screen bg-background antialiased text-dark">
      <NavBar userName={currentUser.name} onNavigate={onNavigate} onLogout={handleLogout} />

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

        {/* 우측: 지역 미선택 → 히스토리 목록 / 선택 → 사진 상세 */}
        <div className="w-1/2 flex flex-col h-full overflow-hidden">
          {selectedRegion === null ? (
            <MyMapHistory onSelectRegion={setSelectedRegion} onNavigate={onNavigate} />
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : (
            <PhotoGrid
              regionName={selectedRegion}
              onBack={() => {
                setSelectedRegion(null);
                // 뒤로가기 시 최신 데이터 다시 로드
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
