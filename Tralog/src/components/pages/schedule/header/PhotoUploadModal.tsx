// PhotoUploadModal.tsx - 사진 추가 모달
// 일정 편집 페이지에서 사진 추가 버튼 클릭 시 표시
// 지역 선택 후 파일 업로드하면 나만의 지도에 사진 저장
//
// ※ AI 도움 - FileReader로 이미지를 base64로 변환 후 서버 전송

import { useState, useRef } from "react";
import { API_BASE_URL } from "../../../../config/api";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleRegion: string;
}

// 지역 선택 옵션 (광역시/도 17개)
const REGION_OPTIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "경기도", "강원특별자치도", "충청북도", "충청남도",
  "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

export default function PhotoUploadModal({
  isOpen,
  onClose,
  scheduleRegion,
}: PhotoUploadModalProps) {
  const [selectedRegion, setSelectedRegion] = useState(scheduleRegion);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("선택된 파일 없음");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달 닫힘 상태면 렌더링 안 함
  if (!isOpen) return null;

  // 파일 선택 - base64 변환 후 업로드, 성공 시 모달 닫기
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedRegion) {
      alert("먼저 지역을 선택해주세요.");
      return;
    }

    setUploadedFileName(file.name);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const scheduleId =
        localStorage.getItem("tralog_active_schedule_id") ||
        `direct-${selectedRegion}`;

      try {
        const response = await fetch(`${API_BASE_URL}/api/map/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schedule_id: scheduleId,
            region: selectedRegion,
            image_data: base64String,
          }),
        });

        if (response.ok) {
          alert(`📸 ${selectedRegion}에 사진이 업로드되었습니다!\n나만의 지도에서 확인하세요.`);
          setUploadedFileName("선택된 파일 없음");
          onClose(); // 업로드 성공 시 모달 닫기
        } else {
          const err = await response.json().catch(() => ({}));
          alert(`업로드 실패: ${err.message || "서버 오류"}`);
        }
      } catch (error) {
        alert("서버 연결에 실패했습니다.");
        console.error("사진 업로드 에러:", error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <dialog className="modal modal-open">
      <div className="box-white max-w-md w-full mx-4 p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="m-0">📸 여행 사진 추가</h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle text-slate-400">✕</button>
        </div>

        <p className="text-xs text-slate-500 font-medium -mt-1">
          사진은 나만의 지도 페이지에서 확인할 수 있어요.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dark">지역 선택</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full h-11 px-3 text-sm input-custom focus:outline-none font-bold"
          >
            <option value="">-- 지역을 선택하세요 --</option>
            {REGION_OPTIONS.map((reg) => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dark">
            사진 파일
            {isUploading && (
              <span className="text-primary ml-2 font-medium animate-pulse">(업로드 중...)</span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <div className="flex-1 input-custom px-3 py-2 text-xs text-gray/70 truncate flex items-center h-11 select-none bg-slate-50">
              {uploadedFileName}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!selectedRegion) {
                  alert("먼저 지역을 선택해주세요.");
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className={`h-11 px-4 text-xs font-bold shrink-0 rounded-(--radius-btn) whitespace-nowrap ${
                isUploading ? "btn-ghost cursor-not-allowed" : "btn-primary"
              }`}
            >
              파일 선택
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          💡 나만의 지도 페이지에서 대표사진으로 설정하면 지도에 이미지가 표시됩니다.
        </p>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}