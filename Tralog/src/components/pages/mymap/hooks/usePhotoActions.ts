// usePhotoActions.ts - 사진 액션 커스텀 훅
// PhotoGrid의 사진 업로드, 대표사진 설정, 삭제 로직 분리
//
// ※ AI 도움 - FileReader로 파일을 base64 문자열로 변환 후 서버 전송

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

  // 현재 지역의 사진 기록 (없으면 빈 객체 반환)
  const currentRecord = mapRecords.find((r) => r.region === regionName) ?? {
    region: regionName,
    images: [],
    coverImage: "",
  };

  // 대표사진은 유저별 저장이라 로그인 유저 ID 필요
  const getUserId = (): string | null => {
    const sessionData = localStorage.getItem("tralog_current_user");
    return sessionData ? JSON.parse(sessionData).id : null;
  };

  // 마이맵 갤러리 업로드는 "나만의 지도"라 개인 저장.
  // 낡은 active_schedule_id(공유 일정)를 재사용하면 일행에게 누수되므로
  // 항상 유저별 지역 ID(direct-유저-지역)로 저장한다. (일정 내 업로드만 일행과 공유)
  const getScheduleId = () => {
    const userId = getUserId();
    return userId ? `direct-${userId}-${regionName}` : `direct-${regionName}`;
  };

  // 파일 업로드 - FileReader로 base64 변환 후 서버 전송 (※ AI 도움)
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
            user_id: getUserId(),
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

  // 선택한 사진을 해당 지역 대표 사진으로 설정
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

  // 선택한 사진 삭제
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
