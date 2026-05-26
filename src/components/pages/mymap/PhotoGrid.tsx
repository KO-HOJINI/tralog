import React, { useState, useRef } from "react";
import type { MapRecord } from "./MyMapPage";

interface PhotoGridProps {
  regionName: string;
  onBack: () => void;
  mapRecords: MapRecord[];
  onSaveRecords: (updated: MapRecord[]) => void;
}

export default function PhotoGrid({
  regionName,
  onBack,
  mapRecords,
  onSaveRecords,
}: PhotoGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 에러 해결: 렌더링 도중 Ref 접근을 방지하기 위해 파일 이름을 추적하는 전용 State 추가
  const [uploadedFileName, setUploadedFileName] =
    useState<string>("선택된 파일 없음");

  const currentRecord = mapRecords.find((r) => r.region === regionName) || {
    region: regionName,
    images: [],
    coverImage: "",
  };

  // 체크 선택된 이미지 인덱스 상태관리
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    if (currentRecord.coverImage) {
      const idx = currentRecord.images.indexOf(currentRecord.coverImage);
      return idx !== -1 ? idx : null;
    }
    return null;
  });

  // 로컬 파일 탐색기 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadedFileName("선택된 파일 없음");
      return;
    }

    // 파일명을 안전하게 스테이트에 기록하여 렌더링 에러 해결
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updatedImages = [...currentRecord.images, base64String];

      const updatedRecords = mapRecords.some((r) => r.region === regionName)
        ? mapRecords.map((r) =>
            r.region === regionName ? { ...r, images: updatedImages } : r,
          )
        : [...mapRecords, { region: regionName, images: updatedImages }];

      onSaveRecords(updatedRecords);

      // 업로드 완료 후 인풋 폼 초기화 및 파일명 안내 초기화
      setUploadedFileName("선택된 파일 없음");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  // 대표 사진 확정 핸들러
  const handleSetCover = () => {
    if (selectedIndex === null) return;
    const selectedSrc = currentRecord.images[selectedIndex];

    const updatedRecords = mapRecords.map((r) =>
      r.region === regionName ? { ...r, coverImage: selectedSrc } : r,
    );
    onSaveRecords(updatedRecords);
    alert(`${regionName}의 대표사진이 지정되었습니다! 지도를 확인해보세요.`);
  };

  return (
    <div className="flex-col-full gap-4">
      {/* 헤더 바 */}
      <div className="bg-pure-white box-custom p-5 shadow-card flex items-center justify-between shrink-0">
        <h2>상세 사진</h2>
        <button
          onClick={onBack}
          className="btn-custom bg-secondary text-pure-white px-5 py-1.5 text-body-caption font-bold shadow-sm"
        >
          돌아가기
        </button>
      </div>

      {/* 내부 사진 컨테이너 */}
      <div className="flex-1 bg-pure-white box-custom p-6 shadow-card flex flex-col overflow-hidden">
        {/* 상단 현재 선택된 도시 표시 및 대표사진 확정 컨트롤 */}
        <div className="bg-primary text-pure-white box-custom p-4 mb-5 flex items-center justify-between shrink-0">
          <span className="text-body-main font-bold text-pure-white">
            {regionName}
          </span>
          <button
            onClick={handleSetCover}
            disabled={selectedIndex === null}
            className="btn-custom bg-secondary text-pure-white px-4 py-1.5 text-body-caption font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            대표사진 선택
          </button>
        </div>

        {/* 3열 사진 배열 그리드 판넬 */}
        <div className="flex-1 overflow-y-auto scrollbar pr-1 mb-5">
          {currentRecord.images.length === 0 ? (
            <div className="h-full flex items-center justify-center text-body-main text-gray/60">
              등록된 사진이 없습니다. 아래에서 사진을 추가해보세요!
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {currentRecord.images.map((imgSrc, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`aspect-square rounded-[24px] overflow-hidden relative border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary scale-[0.98] shadow-md"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt="Travel item"
                      className="w-full h-full object-cover"
                    />
                    {/* 체크 선택 여부 오버레이 인디케이터 */}
                    <div
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border text-body-caption font-bold transition-all ${
                        isSelected
                          ? "bg-primary text-pure-white border-primary"
                          : "bg-pure-white/80 text-transparent border-slate-300"
                      }`}
                    >
                      ✓
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 로컬 파일 직접 사진 추가 업로드 인풋 섹션 */}
        <div className="border-t border-slate-100/80 pt-4 flex flex-col gap-2 shrink-0">
          <label className="text-body-caption font-bold text-dark">
            사진 추가 업로드
          </label>
          <div className="flex gap-3">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex-1 input-custom px-4 py-2 text-body-caption flex items-center text-gray/60 truncate bg-pure-white">
              {uploadedFileName}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-custom bg-primary text-pure-white px-5 py-2 text-body-caption font-bold shadow-sm whitespace-nowrap"
            >
              파일 찾기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
