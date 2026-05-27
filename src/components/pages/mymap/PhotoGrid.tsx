// src/components/pages/mymap/PhotoGrid.tsx
import React, { useState, useRef } from "react";
import { API_BASE_URL } from "../../../config/api";
import type { MapRecord } from "./MyMapPage";

interface PhotoGridProps {
  regionName: string;
  onBack: () => void;
  mapRecords: MapRecord[];
  onRefresh: () => void;
}

export default function PhotoGrid({
  regionName,
  onBack,
  mapRecords,
  onRefresh,
}: PhotoGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] =
    useState<string>("선택된 파일 없음");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // ✅ Fix 1: currentRecord를 mapRecords prop 기반으로 매 렌더마다 재계산
  // (이전에는 useState 초기값으로만 설정되어 onRefresh 후 갱신이 안 됐음)
  const currentRecord = mapRecords.find((r) => r.region === regionName) ?? {
    region: regionName,
    images: [],
    coverImage: "",
  };

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // ✅ Fix 2: 업로드 후 selectedIndex를 초기화하여 이전 선택이 잘못된 인덱스를 가리키는 문제 방지
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      // ✅ Fix 3: active schedule ID가 없을 경우 "direct-{region}" 형식으로 fallback
      // server.js의 direct- prefix 처리 로직과 일치시킴
      const activeScheduleId =
        localStorage.getItem("tralog_active_schedule_id") ||
        `direct-${regionName}`;

      try {
        const response = await fetch(`${API_BASE_URL}/api/map/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schedule_id: activeScheduleId,
            region: regionName,
            image_data: base64String,
          }),
        });

        if (response.ok) {
          setSelectedIndex(null); // 업로드 완료 시 선택 초기화
          onRefresh(); // 부모에서 mapRecords를 다시 fetch → currentRecord 자동 갱신
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData.error || errorData.message || "알 수 없는 에러";
          alert(
            `❌ 서버 업로드 실패\n상태 코드: ${response.status}\n원인: ${errorMsg}`,
          );
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "알 수 없는 오류";
        console.error("업로드 에러:", error);
        alert(`🚨 서버 연결 실패: ${message}`);
      } finally {
        setIsUploading(false);
        setUploadedFileName("선택된 파일 없음");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSetCover = async () => {
    if (selectedIndex === null) return;
    const selectedSrc = currentRecord.images[selectedIndex];
    const activeScheduleId =
      localStorage.getItem("tralog_active_schedule_id") ||
      `direct-${regionName}`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/map/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: activeScheduleId,
          region: regionName,
          image_data: selectedSrc,
        }),
      });

      if (response.ok) {
        alert(`${regionName}의 대표 사진이 지도로 반영되었습니다!`);
        setSelectedIndex(null);
        onRefresh();
      }
    } catch (error) {
      console.error("대표 설정 에러:", error);
    }
  };

  // ✅ Fix 4: 사진 삭제 기능 추가 (기존 코드에 없던 프론트 연동)
  const handleDeletePhoto = async () => {
    if (selectedIndex === null) return;
    if (!window.confirm("선택한 사진을 삭제하시겠습니까?")) return;

    const selectedSrc = currentRecord.images[selectedIndex];
    const activeScheduleId =
      localStorage.getItem("tralog_active_schedule_id") ||
      `direct-${regionName}`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/map/photo`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: activeScheduleId,
          region: regionName,
          image_data: selectedSrc,
        }),
      });

      if (response.ok) {
        setSelectedIndex(null);
        onRefresh();
      }
    } catch (error) {
      console.error("삭제 에러:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-0 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-pure-white box-custom p-5 shadow-card flex items-center justify-between shrink-0">
        <h2 className="m-0">상세 사진</h2>
        <button
          onClick={onBack}
          className="btn-custom bg-gray text-pure-white px-5 py-1.5 text-body-caption font-bold shadow-sm"
        >
          돌아가기
        </button>
      </div>

      <div className="flex-1 bg-pure-white box-custom p-6 shadow-card flex flex-col min-h-0 overflow-hidden">
        {/* 상단 컨트롤 바 */}
        <div className="bg-primary box-custom p-4 mb-5 flex items-center justify-between shrink-0">
          <span className="text-body-main font-bold text-pure-white">
            {regionName} ({currentRecord.images.length}장)
          </span>
          <div className="flex gap-2">
            {/* ✅ 삭제 버튼 추가 */}
            <button
              onClick={handleDeletePhoto}
              disabled={selectedIndex === null || isUploading}
              className="btn-custom bg-red-400 text-pure-white px-4 py-1.5 text-body-caption font-bold shadow-sm disabled:opacity-40"
            >
              사진 삭제
            </button>
            <button
              onClick={handleSetCover}
              disabled={selectedIndex === null || isUploading}
              className="btn-custom bg-secondary text-pure-white px-4 py-1.5 text-body-caption font-bold shadow-sm disabled:opacity-50"
            >
              대표사진 선택
            </button>
          </div>
        </div>

        {/* 사진 그리드 영역 */}
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
                    onClick={() =>
                      setSelectedIndex(isSelected ? null : index)
                    }
                    className={`aspect-square rounded-[24px] overflow-hidden relative border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary scale-[0.98] shadow-md"
                        : isCover
                          ? "border-secondary"
                          : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <img
                      src={
                        imgSrc.startsWith("data:")
                          ? imgSrc
                          : `${API_BASE_URL}${imgSrc}`
                      }
                      alt={`${regionName} 여행 사진 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border text-[11px] font-bold transition-all ${
                        isSelected
                          ? "bg-primary text-pure-white border-primary"
                          : isCover
                            ? "bg-secondary text-pure-white border-secondary shadow-sm"
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

        {/* 하단 업로드 영역 */}
        <div className="border-t border-slate-100/80 pt-4 flex flex-col gap-2 shrink-0">
          <label className="text-body-caption font-bold text-dark">
            사진 추가 업로드{" "}
            {isUploading && (
              <span className="text-primary ml-2 animate-pulse">
                (처리 중...)
              </span>
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
            <div className="flex-1 input-custom px-4 py-2 text-body-caption flex items-center text-gray/70 truncate bg-slate-50 border border-slate-200/60 rounded-xl h-10 select-none">
              {uploadedFileName}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`btn-custom px-5 py-2 text-body-caption font-bold shadow-sm whitespace-nowrap h-10 transition-colors ${
                isUploading
                  ? "bg-gray cursor-not-allowed"
                  : "bg-primary text-pure-white"
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
