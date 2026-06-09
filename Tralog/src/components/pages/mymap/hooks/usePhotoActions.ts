// usePhotoActions.ts - 사진 관련 액션 커스텀 훅
// PhotoGrid 컴포넌트에서 사진 업로드, 대표사진 설정, 삭제 기능을 분리했습니다.
//
// ※ AI 도움을 받아 구현한 부분
// FileReader를 사용해서 파일을 base64 문자열로 변환한 뒤 서버에 전송하는 방법을
// AI 도움으로 작성했습니다. (FileReader API는 비동기로 동작해서 처음에 헷갈렸습니다)

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

  // 현재 지역의 사진 기록을 찾아옵니다 (없으면 빈 객체 반환)
  const currentRecord = mapRecords.find((r) => r.region === regionName) ?? {
    region: regionName,
    images: [],
    coverImage: "",
  };

  // 일정에서 들어온 경우 일정 ID를 사용하고, 직접 들어온 경우 "direct-지역명"을 사용합니다
  const getScheduleId = () =>
    localStorage.getItem("tralog_active_schedule_id") || `direct-${regionName}`;

  // 대표사진은 유저별로 저장되므로 현재 로그인 유저 ID가 필요합니다
  const getUserId = (): string | null => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData).id : null;
  };

  // ※ AI 도움을 받아 구현했습니다
  // FileReader로 이미지 파일을 base64 문자열로 변환해서 서버에 전송합니다.
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
          alert(`업로드 실패 (${response.status}): ${errorMsg}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        console.error("업로드 에러:", error);
        alert(`서버 연결 실패: ${message}`);
      } finally {
        setIsUploading(false);
        setUploadedFileName("선택된 파일 없음");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  // 선택한 사진을 해당 지역의 대표 사진으로 설정합니다
  const handleSetCover = async () => {
    if (selectedIndex === null) return;
    const selectedSrc = currentRecord.images[selectedIndex];

    try {
      const response = await fetch(`${API_BASE_URL}/api/map/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getUserId(),
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

  // 선택한 사진을 삭제합니다
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
