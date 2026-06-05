// ScheduleHeader.tsx - 일정 편집 페이지 헤더 버튼 영역
// 일반 모드: 타임라인/일행 추가/가계부 탭 + 사진 추가/편집 버튼
// 편집 모드: 지역 변경 드롭다운 + 일정 삭제 버튼 + 사진 추가/저장 버튼

import { useState } from "react";
import PhotoUploadModal from "./PhotoUploadModal";

const REGION_OPTIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "경기도", "강원특별자치도", "충청북도", "충청남도",
  "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

interface ScheduleHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onNavigate: (page: string) => void;
  scheduleRegion?: string;
  onChangeRegion: (newRegion: string) => void;
  onDeleteSchedule: () => void;
}

export default function ScheduleHeader({
  activeTab,
  setActiveTab,
  isEditing,
  onToggleEdit,
  scheduleRegion = "",
  onChangeRegion,
  onDeleteSchedule,
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

        {/* 좌측: 일반 모드 → 탭 3개 / 편집 모드 → 지역 변경 + 일정 삭제 */}
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

        {/* 우측: 사진 추가 + 편집/저장 */}
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => setShowPhotoModal(true)}
            className="btn-secondary h-9 px-4 text-body-caption"
          >
            사진 추가
          </button>
          <button onClick={onToggleEdit} className="btn-primary h-9 px-4 text-body-caption">
            {isEditing ? "저장" : "편집"}
          </button>
        </div>
      </div>

      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        scheduleRegion={scheduleRegion}
      />
    </>
  );
}
