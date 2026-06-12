// ScheduleHeader.tsx - 일정 편집 페이지 헤더 버튼 영역
// 일반 모드: 타임라인/일행 추가/가계부 탭 + 사진 추가/편집 버튼
// 편집 모드: 지역 변경 드롭다운 + 일정 삭제 버튼 + 사진 추가/저장 버튼

import { useState } from "react";
import PhotoUploadModal from "./PhotoUploadModal";
import { REGION_OPTIONS } from "../../../../config/regions";

interface ScheduleHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEditing: boolean;
  canEdit: boolean;
  onToggleEdit: () => void;
  onNavigate: (page: string) => void;
  scheduleId: string;
  scheduleRegion?: string;
  onChangeRegion: (newRegion: string) => void;
  onDeleteSchedule: () => void;
}

export default function ScheduleHeader({
  activeTab,
  setActiveTab,
  isEditing,
  canEdit,
  onToggleEdit,
  scheduleId,
  scheduleRegion = "",
  onChangeRegion,
  onDeleteSchedule,
}: ScheduleHeaderProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false); // 사진 업로드 모달 표시 여부

  // 탭 변경 - 타임라인 외 탭으로 가면 편집 모드 해제
  const handleTabChange = (tab: string) => {
    if (tab !== "timeline" && isEditing) onToggleEdit();
    setActiveTab(tab);
  };

  const tabClass = (tab: string) =>
    `h-9 px-4 text-body-caption ${activeTab === tab ? "btn-ghost" : "btn-white"}`;

  return (
    <>
      <div className="flex items-center justify-between box-white p-3 px-5 w-full select-none overflow-x-auto scrollbar-hide">

        {/* 좌측: 일반 모드 -> 탭 3개 / 편집 모드 -> 지역 변경 + 일정 삭제 */}
        {isEditing ? (
          <div className="flex gap-3 items-center shrink-0">
            <select
              value={scheduleRegion}
              onChange={(e) => onChangeRegion(e.target.value)}
              className="h-9 px-3 text-xs font-bold input-custom focus:outline-none"
            >
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button onClick={onDeleteSchedule} className="btn-danger h-9 px-4 text-body-caption">
              일정 삭제
            </button>
          </div>
        ) : (
          <div className="flex gap-3 shrink-0">
            <button onClick={() => handleTabChange("timeline")} className={tabClass("timeline")}>타임라인</button>
            <button onClick={() => handleTabChange("companion")} className={tabClass("companion")}>일행 추가</button>
            <button onClick={() => handleTabChange("account")} className={tabClass("account")}>가계부</button>
          </div>
        )}

        {/* 우측: 사진 추가 + 편집/저장 (읽기 전용 일행은 비활성화) */}
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => setShowPhotoModal(true)}
            disabled={!canEdit}
            className="btn-secondary h-9 px-4 text-body-caption disabled:opacity-40 disabled:cursor-not-allowed"
          >
            사진 추가
          </button>
          <button
            onClick={onToggleEdit}
            disabled={!canEdit}
            className="btn-primary h-9 px-4 text-body-caption disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEditing ? "저장" : "편집"}
          </button>
        </div>
      </div>

      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        scheduleId={scheduleId}
        scheduleRegion={scheduleRegion}
      />
    </>
  );
}
