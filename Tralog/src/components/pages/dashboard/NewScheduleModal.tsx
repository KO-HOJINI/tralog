// NewScheduleModal.tsx - 새 일정 만들기 모달
// 대시보드에서 "+ 새 일정 추가" 버튼 클릭 시 표시
// 여행 지역(필수) + 일정 이름(선택)을 입력받아 일정 생성

import { useState } from "react";

// 지역 선택 드롭다운 옵션 (광역시/도 17개)
const REGION_OPTIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "경기도", "강원특별자치도", "충청북도", "충청남도",
  "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

interface NewScheduleModalProps {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onConfirm: (region: string, title: string) => void;
}

export default function NewScheduleModal({
  isOpen,
  isCreating,
  onClose,
  onConfirm,
}: NewScheduleModalProps) {
  const [region, setRegion] = useState("");
  const [title, setTitle] = useState("");

  if (!isOpen) return null;

  // 확인 - 지역은 필수, 이름 비우면 "새 일정"으로 생성
  const handleConfirm = () => {
    if (!region) {
      alert("여행할 지역을 선택해주세요.");
      return;
    }
    onConfirm(region, title.trim() || "새 일정");
  };

  // 닫기 - 입력값 초기화
  const handleClose = () => {
    setRegion("");
    setTitle("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 - 클릭 시 닫기 */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="box-white relative z-10 max-w-sm w-full p-6 flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h2 className="m-0">새 일정 만들기</h2>
          <button onClick={handleClose} className="btn btn-sm btn-ghost btn-circle text-slate-400">✕</button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dark">
            여행 지역 <span className="text-red-400">*</span>
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full h-11 px-3 text-sm input-custom focus:outline-none font-bold"
          >
            <option value="">-- 여행할 지역을 선택하세요 --</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dark">
            일정 이름
          </label>
          <input
            type="text"
            placeholder="새 일정"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            maxLength={30}
            className="w-full h-11 px-4 text-sm input-custom focus:outline-none"
          />
        </div>

        <div className="flex gap-3 mt-1">
          <button onClick={handleClose} disabled={isCreating} className="btn-dark flex-1 h-11">
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!region || isCreating}
            className="btn-primary flex-1 h-11"
          >
            {isCreating ? "생성 중..." : "일정 만들기"}
          </button>
        </div>
      </div>
    </div>
  );
}
