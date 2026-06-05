// useCompanion.ts - 일행 관리 커스텀 훅
// 일행 목록 불러오기, 추가, 삭제 기능을 담당합니다.
// CompanionSection 컴포넌트에서 데이터 로직을 분리했습니다.
//
// ※ AI 도움을 받아 구현한 부분
// isMounted 패턴과 useCallback을 함께 사용해서
// 컴포넌트 언마운트 후 setState 호출을 방지하는 방법을 AI 도움으로 작성했습니다.

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../../../config/api";

export interface Companion {
  id: string;
  name: string;
  role: "read" | "edit";
}

export function useCompanion(scheduleId: string, currentUserId: string) {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ※ AI 도움을 받아 구현했습니다
  // useCallback으로 감싸서 scheduleId가 바뀔 때만 함수를 새로 만듭니다.
  const fetchCompanions = useCallback(
    async (isMounted: boolean) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (isMounted) {
          setCompanions(data.companions || []);
        }
      } catch (err) {
        console.error("일행 로딩 오류:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    },
    [scheduleId],
  );

  useEffect(() => {
    let isMounted = true;
    const loadData = () => { void fetchCompanions(isMounted); };
    loadData();
    return () => { isMounted = false; };
  }, [fetchCompanions]);

  // 일행 추가 - 중복/본인 여부 확인 후 서버에 저장합니다
  const addCompanion = async (targetId: string, role: string) => {
    setMessage("");
    if (!targetId.trim()) return false;

    if (targetId === currentUserId) {
      setMessage("⚠️ 본인은 일행으로 추가할 수 없습니다.");
      return false;
    }
    if (companions.some((c) => c.id === targetId)) {
      setMessage("⚠️ 이미 추가된 일행입니다.");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/companions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_id: scheduleId, target_id: targetId, role }),
      });
      const data = await res.json();

      if (res.ok) {
        setCompanions((prev) => [...prev, { id: data.id, name: data.name, role: data.role }]);
        setMessage("✅ 일행이 추가되었습니다.");
        return true;
      } else {
        setMessage(data.message || "❌ 추가 실패");
        return false;
      }
    } catch (err) {
      console.error("일행 추가 오류:", err);
      setMessage("❌ 서버 오류가 발생했습니다.");
      return false;
    }
  };

  // 일행 제거
  const removeCompanion = async (targetId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/companions/${scheduleId}/${targetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCompanions((prev) => prev.filter((c) => c.id !== targetId));
      }
    } catch (err) {
      console.error("일행 삭제 오류:", err);
    }
  };

  return { companions, isLoading, message, addCompanion, removeCompanion };
}
