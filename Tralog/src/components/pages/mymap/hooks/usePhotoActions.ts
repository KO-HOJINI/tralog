// usePhotoActions.ts - 사진 액션 커스텀 훅
// PhotoGrid의 사진 업로드, 대표사진 설정, 삭제 로직 분리
//
// ※ AI 도움 - FileReader로 파일을 base64 문자열로 변환 후 서버 전송

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import { API_BASE_URL } from "../../../../config/api";
import type { MapRecord } from "../MyMapPage";

// 대표사진은 유저별 저장이라 로그인 유저 ID 필요
const getUserId = (): string | null => {
  const sessionData = localStorage.getItem("tralog_current_user");
  return sessionData ? JSON.parse(sessionData).id : null;
};

export function usePhotoActions(regionName: string, onRefresh: () => void) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState("선택된 파일 없음"); // 선택한 파일명 표시용
  const [isUploading, setIsUploading] = useState(false); // 업로드 진행 중 여부
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // 갤러리에서 선택된 사진 인덱스

  // 선택한 지역의 사진은 지도 로딩과 분리해 필요할 때만 따로 불러온다.
  // (지도는 대표사진만 받으므로 전체 사진은 이 훅에서 지역별로 지연 로드)
  const [currentRecord, setCurrentRecord] = useState<MapRecord>({
    region: regionName,
    images: [],
    coverImage: "",
  });

  const fetchRegion = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/map/region/${userId}/${encodeURIComponent(regionName)}`,
      );
      if (res.ok) setCurrentRecord(await res.json());
    } catch (error) {
      console.error("지역 사진 로드 에러:", error);
    }
  }, [regionName]);

  // 지역이 바뀌면 해당 지역 사진을 다시 로드
  useEffect(() => {
    fetchRegion();
  }, [fetchRegion]);

  // 업로드/대표설정/삭제 후: 이 지역 갤러리 + 지도 대표사진을 함께 갱신
  const refreshAll = () => {
    fetchRegion();
    onRefresh();
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
          refreshAll();
        } else {
          const errorData = (await response.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
          };
          const errorMsg =
            errorData.error ?? errorData.message ?? "알 수 없는 에러";
          alert(`업로드 실패 (${response.status}): ${errorMsg}`);
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "알 수 없는 오류";
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
        refreshAll();
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
        refreshAll();
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
