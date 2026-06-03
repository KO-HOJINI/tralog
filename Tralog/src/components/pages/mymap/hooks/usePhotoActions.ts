import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { API_BASE_URL } from "../../../../config/api";
import type { MapRecord } from "../MyMapPage";

export function usePhotoActions(
  regionName: string,
  mapRecords: MapRecord[],
  onRefresh: () => void,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState("선택된 파일 없음");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const currentRecord = mapRecords.find((r) => r.region === regionName) ?? {
    region: regionName,
    images: [],
    coverImage: "",
  };

  const getScheduleId = () =>
    localStorage.getItem("tralog_active_schedule_id") || `direct-${regionName}`;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const response = await fetch(`${API_BASE_URL}/api/map/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schedule_id: getScheduleId(),
            region: regionName,
            image_data: base64String,
          }),
        });

        if (response.ok) {
          setSelectedIndex(null);
          onRefresh();
        } else {
          const errorData = await response.json().catch(() => ({})) as { error?: string; message?: string };
          const errorMsg = errorData.error ?? errorData.message ?? "알 수 없는 에러";
          alert(`❌ 서버 업로드 실패\n상태 코드: ${response.status}\n원인: ${errorMsg}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/map/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: getScheduleId(),
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

  const handleDeletePhoto = async () => {
    if (selectedIndex === null) return;
    if (!window.confirm("선택한 사진을 삭제하시겠습니까?")) return;

    const selectedSrc = currentRecord.images[selectedIndex];

    try {
      const response = await fetch(`${API_BASE_URL}/api/map/photo`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: getScheduleId(),
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

  return {
    fileInputRef,
    uploadedFileName,
    isUploading,
    selectedIndex,
    setSelectedIndex,
    currentRecord,
    handleFileChange,
    handleSetCover,
    handleDeletePhoto,
  };
}
