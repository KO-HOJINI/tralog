// ===================================================
// ScheduleList.tsx - 여행 일정 목록
//
// 백엔드 API:
//   GET  /api/schedules/active/:userId  → 진행 중 일정 목록
//   POST /api/schedules                 → 새 일정 생성
//
// D-Day 계산 로직 (오늘 날짜 기준으로 남은 일수)
// AI 도움: D-Day 날짜 계산 + 반응형 카드 레이아웃 구성
// ===================================================

import { useState, useEffect } from "react";
import ScheduleCard from "./ScheduleCard";
import { API_BASE_URL } from "../../../config/api";

interface TravelSchedule {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  dDay: string;
  bgImage?: string;
}

// DB에서 오는 원본 형식 (snake_case)
interface DBSchedule {
  id: string;
  title: string;
  region: string;
  start_date: string;
  end_date: string;
}

interface ScheduleListProps {
  userId: string;
  onNavigate: (page: string, scheduleId?: string) => void;
}

export default function ScheduleList({ userId, onNavigate }: ScheduleListProps) {
  const [schedules, setSchedules] = useState<TravelSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // 새 일정 만들고 바로 편집 페이지로 이동
  const createNewSchedule = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: "새 일정",
          region: "서울특별시",
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date().toISOString().slice(0, 10),
          status: "planning",
        }),
      });

      if (!response.ok) throw new Error("일정 생성에 실패했습니다.");

      const data = await response.json();
      if (data.id) {
        onNavigate("schedule", data.id);
      } else {
        throw new Error("새 일정 ID를 받지 못했습니다.");
      }
    } catch (error) {
      console.error("새 일정 생성 오류:", error);
      alert("새 일정 생성에 실패했습니다. 콘솔을 확인하세요.");
    } finally {
      setIsCreating(false);
    }
  };

  // 일정 목록 불러오기 + D-Day 계산해서 UI용 형식으로 변환
  useEffect(() => {
    if (!userId) return;

    fetch(`${API_BASE_URL}/api/schedules/active/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
        return res.json();
      })
      .then((data: DBSchedule[]) => {
        const formattedSchedules = data.map((item) => {
          // D-Day 계산 (AI 도움 받은 부분)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const start = new Date(item.start_date);
          start.setHours(0, 0, 0, 0);

          const diffDays = Math.ceil(
            (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          const dDayString =
            diffDays > 0 ? `D-${diffDays}` :
            diffDays === 0 ? "D-Day" :
            `D+${Math.abs(diffDays)}`;

          return {
            id: item.id,
            title: item.title,
            location: item.region,
            startDate: item.start_date.split("T")[0],
            endDate: item.end_date.split("T")[0],
            dDay: dDayString,
          };
        });
        setSchedules(formattedSchedules);
      })
      .catch((err) => console.error("일정 로드 오류:", err))
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <div className="flex-col-full gap-5">

      {/* 헤더: 제목 + 새 일정 추가 버튼 */}
      <div className="flex justify-between items-center px-1 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1>나의 여행 일정</h1>
          <p className="text-body-main text-slate-400">
            다음 여행을 계획하고 기억을 만들어보세요
          </p>
        </div>
        <button
          onClick={createNewSchedule}
          disabled={isCreating}
          className="btn-primary h-10 px-5 shrink-0"
        >
          <h3 className="text-white font-bold">
            {isCreating ? "생성중..." : "+ 새 일정 추가"}
          </h3>
        </button>
      </div>

      {/* 카드 목록 */}
      <div className="flex-1 h-0 overflow-y-auto pt-2 pb-4 px-2 scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-sm text-gray animate-pulse">일정을 불러오는 중...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-5">
            {schedules.map((schedule, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={schedule.id}
                  className={`shrink-0 transition-all duration-300 ${
                    isFirst ? "w-full h-80" : "w-full 2xl:w-[calc(50%-10px)] h-64"
                  }`}
                >
                  <ScheduleCard schedule={schedule} onNavigate={onNavigate} />
                </div>
              );
            })}

            {/* 새 일정 추가 카드 (빈 슬롯) */}
            <div
              className={`box-muted shrink-0 transition-all duration-300 border-2 border-dashed border-slate-200 hover:border-slate-300 overflow-hidden ${
                schedules.length === 0 ? "w-full h-80" : "w-full 2xl:w-[calc(50%-10px)] h-64"
              }`}
            >
              <button
                onClick={createNewSchedule}
                disabled={isCreating}
                className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-slate-600 transition-all group rounded-[inherit] disabled:cursor-not-allowed"
              >
                <span className="text-number-accent font-light p-3 bg-white rounded-full shadow-card group-hover:scale-110 transition-transform flex items-center justify-center w-12 h-12 border border-slate-100">
                  +
                </span>
                <span className="text-body-main">
                  {isCreating ? "생성중..." : "새로운 여행 일정 추가하기"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
