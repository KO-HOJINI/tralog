// ===================================================
// ScheduleHeader.tsx - 알약 모양 탭 메뉴 + 편집 버튼
//
// 피그마 디자인:
//   - 흰 배경 알약 모양 컨테이너 (rounded-full)
//   - 활성 탭: dark(slate-700) 배경
//   - 우측: primary(teal) 편집/저장 버튼
// ===================================================

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

  // 탭 변경 + 편집 모드 자동 종료
  const handleTabChange = (tab: string) => {
    if (tab !== "timeline" && isEditing) onToggleEdit();
    setActiveTab(tab);
  };

  // 탭별 스타일 계산
  const tabClass = (tab: string) =>
    `px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
      activeTab === tab
        ? "bg-slate-700 text-white shadow-sm"
        : "bg-transparent text-slate-500 hover:bg-slate-100"
    }`;

  return (
    <div className="flex items-center w-full justify-between box-white px-2.5 py-2 border border-slate-100 shadow-card select-none" style={{ borderRadius: "999px", minWidth: "520px" }}>

      {/* 좌측 탭 3개 */}
      <div className="flex gap-1">
        <button onClick={() => handleTabChange("timeline")} className={tabClass("timeline")}>
          타임라인
        </button>
        <button onClick={() => handleTabChange("companion")} className={tabClass("companion")}>
          👥 일행 추가
        </button>
        <button onClick={() => handleTabChange("account")} className={tabClass("account")}>
          💳 가계부
        </button>
      </div>

      {/* 우측: 일정 편집 / 저장 버튼 (타임라인 탭에서만 활성화) */}
      <button
        disabled={activeTab !== "timeline"}
        onClick={onToggleEdit}
        className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all shadow-sm ${
          activeTab !== "timeline"
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "btn-primary"
        }`}
      >
        {isEditing ? "✔️ 저장하기" : "일정 편집"}
      </button>
    </div>
  );
}
