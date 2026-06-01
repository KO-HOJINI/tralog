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

  const fetchCompanions = useCallback(
    async (isMounted: boolean) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) return;
        const data = await res.json();

        // 화면 이탈된 후 상태 업데이트를 방지하여 성능 최적화
        if (isMounted) {
          setCompanions(data.companions || []);
        }
      } catch (err) {
        console.error("일행 로딩 오류 상세:", err);
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

    const loadData = () => {
      void fetchCompanions(isMounted);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchCompanions]);

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
        body: JSON.stringify({
          schedule_id: scheduleId,
          target_id: targetId,
          role,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setCompanions((prev) => [
          ...prev,
          { id: data.id, name: data.name, role: data.role },
        ]);
        setMessage("✅ 일행이 추가되었습니다.");
        return true;
      } else {
        setMessage(data.message || "❌ 추가 실패");
        return false;
      }
    } catch (err) {
      console.error("일행 추가 오류 상세:", err);
      setMessage("❌ 서버 오류가 발생했습니다.");
      return false;
    }
  };

  const removeCompanion = async (targetId: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/companions/${scheduleId}/${targetId}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        setCompanions((prev) => prev.filter((c) => c.id !== targetId));
      }
    } catch (err) {
      console.error("일행 삭제 오류 상세:", err);
    }
  };

  return { companions, isLoading, message, addCompanion, removeCompanion };
}
