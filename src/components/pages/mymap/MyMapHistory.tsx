interface MyMapHistoryProps {
  onSelectRegion: (region: string) => void;
  onNavigate: (page: string) => void;
}

export default function MyMapHistory({
  onSelectRegion,
  onNavigate,
}: MyMapHistoryProps) {
  // 대한민국 표준 17개 광역지자체 풀 리스트 동기화
  const travelHistory = [
    { name: "서울특별시" },
    { name: "인천광역시" },
    { name: "경기도" },
    { name: "강원특별자치도" },
    { name: "충청북도" },
    { name: "충청남도" },
    { name: "세종특별자치시" },
    { name: "대전광역시" },
    { name: "경상북도" },
    { name: "대구광역시" },
    { name: "울산광역시" },
    { name: "부산광역시" },
    { name: "경상남도" },
    { name: "전북특별자치도" },
    { name: "광주광역시" },
    { name: "전라남도" },
    { name: "제주특별자치도" },
  ];

  return (
    <div className="flex-col-full gap-4">
      {/* 타이틀 헤더 */}
      <div className="bg-pure-white box-custom p-5 shadow-card shrink-0">
        <h2 className="text-lg font-bold">나의 여행 기록</h2>
      </div>

      {/* 스크롤 리스트 바디 */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar space-y-4 max-h-[calc(100vh-180px)]">
        {/* 지역 추가 카드 상단 고정 */}
        <div className="bg-primary text-pure-white box-custom p-5 flex items-center justify-between shadow-card">
          <div className="flex items-center gap-2 select-none">
            <span className="text-base font-bold">지역 추가</span>
            <span className="text-sm">📷</span>
          </div>
          <button
            onClick={() => onNavigate("schedule")}
            className="btn-custom bg-secondary text-pure-white px-5 py-2 text-xs font-bold shadow-sm"
          >
            사진 등록
          </button>
        </div>

        {/* 저장 목록 바인딩 */}
        {travelHistory.map((history, idx) => (
          <div
            key={idx}
            className="bg-pure-white border border-slate-100/70 box-custom p-5 flex items-center justify-between shadow-card hover:border-slate-200 transition-all"
          >
            <span className="text-base font-bold text-dark">
              {history.name}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("schedule")}
                className="btn-custom bg-gray text-pure-white px-4 py-2 text-xs font-medium"
              >
                지난 일정 보기
              </button>
              <button
                onClick={() => onSelectRegion(history.name)}
                className="btn-custom bg-secondary text-pure-white px-4 py-2 text-xs font-medium shadow-sm"
              >
                사진 보기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
