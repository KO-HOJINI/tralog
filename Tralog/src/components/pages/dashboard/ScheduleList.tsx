// ScheduleList.tsx - 대시보드 우측 여행 일정 목록
// 진행 중인 일정을 불러와 D-Day 계산 후 카드로 표시
// 종료된 일정(endDate가 오늘보다 과거)은 목록에서 제외
// "+ 새 일정 추가" 클릭 시 지역 선택 모달 표시, 확인하면 일정 생성

import { useState, useEffect } from "react";
import ScheduleCard from "./ScheduleCard";
import NewScheduleModal from "./NewScheduleModal";
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

// DB 원본 형식 (bgImage 포함)
interface DBSchedule {
  id: string;
  title: string;
  region: string;
  start_date: string;
  end_date: string;
  bgImage?: string;
}

interface ScheduleListProps {
  userId: string;
  onNavigate: (page: string, scheduleId?: string) => void;
}

export default function ScheduleList({
  userId,
  onNavigate,
}: ScheduleListProps) {
  const [schedules, setSchedules] = useState<TravelSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // 모달 확인 - 새 일정 생성 후 편집 페이지로 이동
  const handleCreateConfirm = async (region: string, title: string) => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title,
          region,
          start_date: getLocalDateString(),
          end_date: getLocalDateString(),
          status: "planning",
        }),
      });

      if (!response.ok) throw new Error("일정 생성에 실패했습니다.");

      const data = await response.json();
      if (data.id) {
        setShowModal(false);
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

  // 로컬 날짜를 YYYY-MM-DD 문자열로 변환 (시차 오류 방지)
  const getLocalDateString = (date: Date = new Date()): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 일정 목록 로드 + D-Day 계산 + 종료된 일정 숨김
  useEffect(() => {
    if (!userId) return;

    fetch(`${API_BASE_URL}/api/schedules/active/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
        return res.json();
      })
      .then((data: DBSchedule[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ISO 포맷(T...) 수신 시 시차 오류 방지용 로컬 문자열 변환
        const formatLocalDateString = (rawDate: string | undefined) => {
          if (!rawDate) return "";
          if (rawDate.includes("T")) {
            const dateObj = new Date(rawDate);
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, "0");
            const d = String(dateObj.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }
          return rawDate.slice(0, 10);
        };

        // 종료된 일정 필터링 (endDate가 오늘보다 과거면 제외)
        const activeSchedules = data.filter((item) => {
          const End = formatLocalDateString(item.end_date);
          const [ey, em, ed] = End.split("-").map(Number);
          const endDate = new Date(ey, em - 1, ed);
          return endDate >= today;
        });

        const formattedSchedules = activeSchedules.map((item) => {
          // D-Day 계산
          const Start = formatLocalDateString(item.start_date);
          const End = formatLocalDateString(item.end_date);

          const [sy, sm, sd] = Start.split("-").map(Number);
          const start = new Date(sy, sm - 1, sd);

          const diffDays = Math.ceil(
            (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          const dDayString =
            diffDays > 0
              ? `D-${diffDays}`
              : diffDays === 0
                ? "D-Day"
                : `D+${Math.abs(diffDays)}`;

          return {
            id: item.id,
            title: item.title,
            location: item.region,
            startDate: Start,
            endDate: End,
            dDay: dDayString,
            bgImage: item.bgImage,
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
          onClick={() => setShowModal(true)}
          className="btn-primary h-10 px-5 shrink-0"
        >
          <h3 className="text-white font-bold">+ 새 일정 추가</h3>
        </button>
      </div>

      {/* 카드 목록 */}
      <div className="flex-1 h-0 overflow-y-auto pt-2 pb-4 px-2 scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-5">
            {schedules.map((schedule, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={schedule.id}
                  className={`shrink-0 transition-all duration-300 ${
                    isFirst
                      ? "w-full h-80"
                      : "w-full 2xl:w-[calc(50%-10px)] h-64"
                  }`}
                >
                  <ScheduleCard schedule={schedule} onNavigate={onNavigate} />
                </div>
              );
            })}

            {/* 새 일정 추가 카드 (빈 슬롯) */}
            <div
              className={`box-muted shrink-0 transition-all duration-300 border-2 border-dashed border-slate-200 hover:border-slate-300 overflow-hidden ${
                schedules.length === 0
                  ? "w-full h-80"
                  : "w-full 2xl:w-[calc(50%-10px)] h-64"
              }`}
            >
              <button
                onClick={() => setShowModal(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-slate-600 transition-all group rounded-[inherit]"
              >
                <span className="text-number-accent font-light p-3 bg-white rounded-full shadow-card group-hover:scale-110 transition-transform flex items-center justify-center w-12 h-12 border border-slate-100">
                  +
                </span>
                <span className="text-body-main">새로운 여행 일정 추가하기</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <NewScheduleModal
        isOpen={showModal}
        isCreating={isCreating}
        onClose={() => setShowModal(false)}
        onConfirm={handleCreateConfirm}
      />
    </div>
  );
}
