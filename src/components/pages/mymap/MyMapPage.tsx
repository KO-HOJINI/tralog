import { useState, useEffect } from "react";
import NavBar from "../../Navbar"; 

interface MyMapPageProps {
  onNavigate: (page: string) => void;
}

interface RegionData {
  id: string;
  name: string;
  coverImage: string | null;
  detailImages: string[];
}

interface UserSession {
  id: string;
  name: string;
}

const INITIAL_REGIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", 
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시", 
  "경기도", "강원특별자치도", "충청북도", "충청남도", 
  "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도"
];

export default function MyMapPage({ onNavigate }: MyMapPageProps) {
  // 1. 초기 지연 평가(Lazy Initialization) 단계에서 동기적으로 세션 데이터 셋업
  const [currentUser] = useState<UserSession | null>(() => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? (JSON.parse(sessionData) as UserSession) : null;
  });

  // 2. 초기 맵 데이터 로드도 useState 단계에서 안전하게 처리 (연쇄 렌더링 원인 제거)
  const [regions, setRegions] = useState<RegionData[]>(() => {
    if (!currentUser) return [];
    
    const storedMap = localStorage.getItem(`tralog_map_${currentUser.id}`);
    if (storedMap) {
      return JSON.parse(storedMap);
    } else {
      const defaultData: RegionData[] = INITIAL_REGIONS.map((name, index) => ({
        id: `reg-${index + 1}`,
        name,
        coverImage: currentUser.id === "admin" && name === "제주특별자치도" 
          ? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" 
          : null,
        detailImages: []
      }));
      localStorage.setItem(`tralog_map_${currentUser.id}`, JSON.stringify(defaultData));
      return defaultData;
    }
  });
  
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [modalType, setModalType] = useState<"detail" | "cover" | null>(null);

  // 3. 세션이 없을 때 화면 이동 인터셉트만 Effect로 관리 (안전함)
  useEffect(() => {
    if (!currentUser) {
      onNavigate("login");
    }
  }, [currentUser, onNavigate]);

  if (!currentUser) return null;

  const updateStorage = (updatedRegions: RegionData[]) => {
    setRegions(updatedRegions);
    localStorage.setItem(`tralog_map_${currentUser.id}`, JSON.stringify(updatedRegions));
  };

  const handleCoverUpload = (regionId: string, imageUrl: string) => {
    const updated = regions.map(r => r.id === regionId ? { ...r, coverImage: imageUrl } : r);
    updateStorage(updated);
    
    if (selectedRegion && selectedRegion.id === regionId) {
      setSelectedRegion({ ...selectedRegion, coverImage: imageUrl });
    }
    setModalType(null);
  };

  const handleDetailUpload = (regionId: string, imageUrl: string) => {
    const updated = regions.map(r => 
      r.id === regionId ? { ...r, detailImages: [...r.detailImages, imageUrl] } : r
    );
    updateStorage(updated);

    if (selectedRegion && selectedRegion.id === regionId) {
      setSelectedRegion({ ...selectedRegion, detailImages: [...selectedRegion.detailImages, imageUrl] });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tralog_current_user");
    onNavigate("login");
  };

  const visitedCount = regions.filter(r => r.coverImage).length;

  return (
    <div className="h-screen bg-background flex flex-col font-sans antialiased text-dark overflow-hidden">
      <NavBar userName={currentUser.name} onNavigate={onNavigate} onLogout={handleLogout} />
      {/* ... 하단 레이아웃 본문 코드 생략 (기존과 완벽 동일) ... */}
      <main className="flex-1 h-0 max-w-6xl w-full mx-auto px-16 py-8 flex flex-col md:flex-row gap-8 items-stretch overflow-hidden">
        <div className="w-[45%] flex flex-col shrink-0 h-full gap-4">
          <div className="flex justify-between items-baseline select-none">
            <h1>나만의 지도 채우기</h1>
            <p className="text-xs text-gray font-medium">
              기록된 구역: <span className="text-primary font-bold">{visitedCount}</span> / 17
            </p>
          </div>
          <div className="box-custom flex-1 bg-pure-white border border-slate-100 flex flex-col items-center justify-center p-6 relative">
            <div className="w-full h-full rounded-2xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center p-4">
              <div className="w-40 h-56 border-4 border-primary/20 rounded-full flex flex-col items-center justify-center bg-teal-50/40 select-none animate-pulse">
                <span className="text-xs text-primary font-black tracking-widest">KOREA MAP</span>
              </div>
              <p className="text-center text-xs text-gray mt-6 leading-relaxed">
                오른쪽 리스트에서 가고 싶은 행정구역의<br/>
                <span className="text-secondary font-bold">대표 사진 설정</span> 및 <span className="text-primary font-bold">사진보기</span>를 제어하세요.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col h-full gap-4 pt-1">
          <div className="flex justify-between items-center select-none shrink-0">
            <h1>나의 여행 기록</h1>
            <button className="btn btn-custom h-9 bg-dark text-white font-bold text-xs px-4 hover:bg-slate-800">지역 추가</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
            {regions.map((region) => (
              <div key={region.id} className="box-custom bg-pure-white p-5 border border-slate-100/80 flex items-center justify-between shadow-custom">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200/60 overflow-hidden flex items-center justify-center shrink-0">
                    {region.coverImage ? <img src={region.coverImage} alt={region.name} className="w-full h-full object-cover" /> : <span className="text-lg">📍</span>}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-dark">{region.name}</h2>
                    <p className="text-xs text-gray mt-0.5 font-medium">{region.coverImage ? "📸 추억 기록 완료" : "아직 등록된 사진이 없습니다."}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedRegion(region); setModalType("cover"); }} className="btn h-9 rounded-xl border border-slate-200 text-xs font-bold text-gray px-3.5 bg-pure-white">대표사진 {region.coverImage ? "수정" : "등록"}</button>
                  <button onClick={() => { setSelectedRegion(region); setModalType("detail"); }} className="btn h-9 rounded-xl bg-primary text-white text-xs font-bold px-4">사진보기</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 모달 팝업 가시 영역 */}
      {selectedRegion && modalType && (
        <div className="fixed inset-0 bg-dark/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-pure-white w-full max-w-md rounded-4xl p-8 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <span className="text-xs font-black text-primary tracking-wide uppercase">{modalType === "cover" ? "대표 사진 지정하기" : "상세 사진 컬렉션"}</span>
                <h1 className="text-xl font-bold text-dark mt-0.5">{selectedRegion.name}</h1>
              </div>
              <button onClick={() => { setSelectedRegion(null); setModalType(null); }} className="w-8 h-8 rounded-full bg-slate-100 text-gray text-sm flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              {modalType === "cover" ? (
                <div className="flex flex-col gap-4">
                  {selectedRegion.coverImage && <div className="w-full h-48 rounded-2xl overflow-hidden"><img src={selectedRegion.coverImage} alt="Cover" className="w-full h-full object-cover" /></div>}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-dark">이미지 URL 입력</p>
                    <input type="text" placeholder="https://example.com/image.jpg" defaultValue={selectedRegion.coverImage || ""} id="coverUrlInput" className="w-full h-12 px-4 text-sm focus:outline-none input-custom" />
                  </div>
                  <button onClick={() => { const input = document.getElementById("coverUrlInput") as HTMLInputElement; if (input && input.value.trim()) handleCoverUpload(selectedRegion.id, input.value.trim()); }} className="w-full h-12 bg-dark text-white font-bold text-sm btn-custom mt-2">대표 사진 확정</button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold text-dark">새로운 상세 이미지 주소 입력</p>
                    <div className="flex gap-2">
                      <input type="text" placeholder="URL 입력" id="detailUrlInput" className="flex-1 h-11 px-4 text-xs focus:outline-none input-custom" />
                      <button onClick={() => { const input = document.getElementById("detailUrlInput") as HTMLInputElement; if (input && input.value.trim()) { handleDetailUpload(selectedRegion.id, input.value.trim()); input.value = ""; } }} className="h-11 px-4 bg-primary text-white text-xs font-bold rounded-xl">추가</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray mb-3">등록된 상세 사진 ({selectedRegion.detailImages.length})</p>
                    {selectedRegion.detailImages.length === 0 ? (
                      <div className="p-10 border border-dashed border-slate-200 text-center rounded-2xl text-xs text-gray bg-slate-50">등록된 상세 사진이 없습니다.</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedRegion.detailImages.map((img, i) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200"><img src={img} alt={`Detail ${i}`} className="w-full h-full object-cover" /></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}