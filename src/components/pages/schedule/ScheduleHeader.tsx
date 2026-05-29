// src/components/pages/schedule/ScheduleHeader.tsx

interface ScheduleHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onNavigate: (page: string) => void;
}

export default function ScheduleHeader({
  activeTab,
  setActiveTab,
  isEditing,
  onToggleEdit,
}: ScheduleHeaderProps) {
  return (
    // ✅ 피그마 디자인: 길쭉한 하얀색 알약 모양의 배경 박스
    <div className="flex items-center justify-between bg-white rounded-full shadow-sm px-2.5 py-2 w-[550px] border border-slate-100 select-none">
      
      {/* 왼쪽: 3개의 탭 메뉴 (피그마의 다크 그레이 색상 적용) */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all ${
            activeTab === "timeline"
              ? "bg-[#4b5563] text-white shadow-sm"
              : "bg-transparent text-slate-500 hover:bg-slate-100"
          }`}
        >
          타임라인
        </button>
        <button
          onClick={() => {
            setActiveTab("companion");
            if (isEditing) onToggleEdit();
          }}
          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
            activeTab === "companion"
              ? "bg-[#4b5563] text-white shadow-sm"
              : "bg-transparent text-slate-500 hover:bg-slate-100"
          }`}
        >
          👥 일행 추가
        </button>
        <button
          onClick={() => {
            setActiveTab("account");
            if (isEditing) onToggleEdit();
          }}
          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
            activeTab === "account"
              ? "bg-[#4b5563] text-white shadow-sm"
              : "bg-transparent text-slate-500 hover:bg-slate-100"
          }`}
        >
          💳 가계부
        </button>
      </div>

      {/* 오른쪽: 청록색 일정 편집 버튼 */}
      <button
        disabled={activeTab !== "timeline"}
        onClick={onToggleEdit}
        className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all shadow-sm ${
          activeTab !== "timeline"
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : isEditing
              ? "bg-[#0d9488] text-white hover:bg-teal-700"
              : "bg-[#0d9488] text-white hover:bg-teal-700"
        }`}
      >
        {isEditing ? "✔️ 저장하기" : "일정 편집"}
      </button>
    </div>
  );
}