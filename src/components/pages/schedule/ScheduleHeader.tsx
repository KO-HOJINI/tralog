interface ScheduleHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEditing: boolean;
  setIsEditing: (edit: boolean) => void;
}

export default function ScheduleHeader({
  activeTab,
  setActiveTab,
  isEditing,
  setIsEditing,
}: ScheduleHeaderProps) {
  return (
    <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0 select-none items-center justify-between gap-1">
      {/* 탭 전환 영역 */}
      <div className="flex flex-1 gap-1">
        <button
          onClick={() => {
            setActiveTab("timeline");
          }}
          className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "timeline"
              ? "bg-pure-white text-dark shadow-sm"
              : "text-gray hover:text-dark"
          }`}
        >
          🕒 타임라인
        </button>
        <button
          onClick={() => {
            setActiveTab("account");
            setIsEditing(false);
          }}
          className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "account"
              ? "bg-pure-white text-dark shadow-sm"
              : "text-gray hover:text-dark"
          }`}
        >
          💰 가계부
        </button>
        <button
          onClick={() => {
            setActiveTab("companion");
            setIsEditing(false);
          }}
          className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "companion"
              ? "bg-pure-white text-dark shadow-sm"
              : "text-gray hover:text-dark"
          }`}
        >
          👥 일행 추가
        </button>
      </div>

      {/* 구분선 및 일정 편집 버튼 컨트롤러 */}
      <div className="h-6 w-px bg-slate-300 mx-1 shrink-0" />

      <button
        disabled={activeTab !== "timeline"}
        onClick={() => setIsEditing(!isEditing)}
        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shrink-0 border-none ${
          activeTab !== "timeline"
            ? "opacity-40 cursor-not-allowed text-slate-400 bg-transparent"
            : isEditing
              ? "bg-secondary text-white shadow-sm"
              : "bg-dark text-white hover:bg-slate-800"
        }`}
      >
        {isEditing ? "✅ 완료" : "🛠️ 일정편집"}
      </button>
    </div>
  );
}
