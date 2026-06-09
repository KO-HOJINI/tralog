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
  scheduleId: string;
  scheduleRegion: string;
}

export default function PhotoUploadModal({
  isOpen,
  onClose,
  scheduleId,
  scheduleRegion,
}: PhotoUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("선택된 파일 없음");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달 닫힘 상태면 렌더링 안 함
  if (!isOpen) return null;

  // 파일 선택 - base64 변환 후 업로드, 성공 시 모달 닫기
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      // 편집 중인 바로 그 일정에 사진을 연결한다. (별도 'direct-' 더미 일정을 만들지 않음)
      // → 마이맵 히스토리에서 "직접 기록"이 아니라 해당 일정의 사진으로 표시된다.
      const session = localStorage.getItem("tralog_current_user");
      const userId = session ? (JSON.parse(session) as { id: string }).id : null;

      try {
        const response = await fetch(`${API_BASE_URL}/api/map/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schedule_id: scheduleId,
            user_id: userId,
            region: scheduleRegion,
            image_data: base64String,
          }),
        });

        if (response.ok) {
          alert(`📸 ${scheduleRegion}에 사진이 업로드되었습니다!\n나만의 지도에서 확인하세요.`);
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
          <label className="text-xs font-bold text-dark">지역</label>
          <div className="w-full h-11 px-3 text-sm input-custom font-bold flex items-center bg-slate-50 text-dark select-none">
            {scheduleRegion}
          </div>
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
              onClick={() => fileInputRef.current?.click()}
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