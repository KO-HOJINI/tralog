import { useState } from "react";
import PhotoUploadModal from "./PhotoUploadModal";

interface ScheduleHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onNavigate: (page: string) => void;
  scheduleRegion?: string;
}

export default function ScheduleHeader({
  activeTab,
  setActiveTab,
  isEditing,
  onToggleEdit,
  scheduleRegion = "",
}: ScheduleHeaderProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab !== "timeline" && isEditing) onToggleEdit();
    setActiveTab(tab);
  };

  const tabClass = (tab: string) =>
    `h-9 px-4 text-body-caption ${activeTab === tab ? "btn-ghost" : "btn-white"}`;

  return (
    <>
      <div className="flex items-center justify-between box-white p-3 px-5 w-full select-none overflow-x-auto scrollbar-hide">
        {/* 좌측 탭 3개 */}
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => handleTabChange("timeline")}
            className={tabClass("timeline")}
          >
            타임라인
          </button>
          <button
            onClick={() => handleTabChange("companion")}
            className={tabClass("companion")}
          >
            일행 추가
          </button>
          <button
            onClick={() => handleTabChange("account")}
            className={tabClass("account")}
          >
            가계부
          </button>
        </div>

        {/* 우측 사진 추가, 편집 */}
        <div className="flex gap-3 shrink-0">
          {/* 사진 추가 버튼 클릭 시 모달 오픈 상태를 true로 */}
          <button
            onClick={() => setShowPhotoModal(true)}
            className="btn-secondary h-9 px-4 text-body-caption"
          >
            사진 추가
          </button>

          {/* 일정 편집 / 저장 버튼 */}
          <button
            disabled={activeTab !== "timeline"}
            onClick={onToggleEdit}
            className={`btn-primary h-9 px-4 text-body-caption ${
              activeTab !== "timeline"
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "btn-primary"
            }`}
          >
            {isEditing ? "저장" : "편집"}
          </button>
        </div>
      </div>

      {/* 사진 업로드 모달 */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        scheduleRegion={scheduleRegion}
      />
    </>
  );
}
