// PhotoGrid.tsx - 지역별 사진 그리드
// 선택된 지역의 사진 목록을 3열 그리드로 보여줍니다.
// 사진 업로드, 대표사진 설정, 삭제 기능이 있습니다.
// API 관련 로직은 usePhotoActions 훅으로 분리했습니다.

import { usePhotoActions } from "./hooks/usePhotoActions";
import { API_BASE_URL } from "../../../config/api";
import type { MapRecord } from "./MyMapPage";

interface PhotoGridProps {
  regionName: string;
  onBack: () => void;
  mapRecords: MapRecord[];
  onRefresh: () => void;
}

export default function PhotoGrid({ regionName, onBack, mapRecords, onRefresh }: PhotoGridProps) {
  const {
    fileInputRef,
    uploadedFileName,
    isUploading,
    selectedIndex,
    setSelectedIndex,
    currentRecord,
    handleFileChange,
    handleSetCover,
    handleDeletePhoto,
  } = usePhotoActions(regionName, mapRecords, onRefresh);

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-0 overflow-hidden">

      {/* 헤더 */}
      <div className="box-white p-5 shadow-card flex items-center justify-between shrink-0">
        <h2 className="m-0">상세 사진</h2>
        <button onClick={onBack} className="btn-ghost px-5 py-1.5 text-body-caption">
          돌아가기
        </button>
      </div>

      <div className="flex-1 box-white p-6 shadow-card flex flex-col min-h-0 overflow-hidden">

        {/* 컨트롤 바: 장수 표시 + 삭제/대표사진 버튼 */}
        <div className="bg-primary box-white p-4 mb-5 flex items-center justify-between shrink-0">
          <span className="text-body-main font-bold text-pure-white">
            {regionName} ({currentRecord.images.length}장)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleDeletePhoto}
              disabled={selectedIndex === null || isUploading}
              className="btn-danger px-4 py-1.5 text-body-caption"
            >
              사진 삭제
            </button>
            <button
              onClick={handleSetCover}
              disabled={selectedIndex === null || isUploading}
              className="btn-secondary px-4 py-1.5 text-body-caption"
            >
              대표사진 선택
            </button>
          </div>
        </div>

        {/* 사진 그리드 */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar pr-1 mb-5">
          {currentRecord.images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-body-main text-gray select-none opacity-60">
              <span className="text-2xl mb-2">📸</span>
              등록된 사진이 없습니다. 아래에서 사진을 추가해보세요!
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 auto-rows-max p-1">
              {currentRecord.images.map((imgSrc, index) => {
                const isSelected = selectedIndex === index;
                const isCover = currentRecord.coverImage === imgSrc;

                return (
                  <div
                    key={`${imgSrc.slice(-20)}-${index}`}
                    onClick={() => setSelectedIndex(isSelected ? null : index)}
                    className={`box-white aspect-square overflow-hidden relative border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary scale-[0.98]"
                        : isCover
                          ? "border-secondary"
                          : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <img
                      src={imgSrc.startsWith("data:") ? imgSrc : `${API_BASE_URL}${imgSrc}`}
                      alt={`${regionName} 여행 사진 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${
                        isSelected
                          ? "bg-primary text-pure-white border-primary"
                          : isCover
                            ? "bg-secondary text-pure-white border-secondary"
                            : "bg-pure-white/90 text-transparent border-slate-300"
                      }`}
                    >
                      {isCover && !isSelected ? "★" : "✓"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 사진 업로드 영역 */}
        <div className="border-t border-slate-100/80 pt-4 flex flex-col gap-2 shrink-0">
          <label className="text-body-caption font-bold text-dark">
            사진 추가 업로드{" "}
            {isUploading && (
              <span className="text-primary ml-2 animate-pulse">(처리 중...)</span>
            )}
          </label>
          <div className="flex gap-3">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <div className="flex-1 input-custom px-4 py-2 text-body-caption flex items-center text-gray/70 truncate bg-slate-50 h-10 select-none">
              {uploadedFileName}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`px-5 py-2 text-body-caption font-bold whitespace-nowrap h-10 transition-colors rounded-(--radius-btn) ${
                isUploading ? "btn-ghost cursor-not-allowed" : "btn-primary"
              }`}
            >
              파일 찾기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
