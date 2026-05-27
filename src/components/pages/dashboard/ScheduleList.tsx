import { useState, useEffect } from "react";
import ScheduleCard from "./ScheduleCard";

// 1. dDay의 '?' 옵셔널 마크 제거 (에러 79번 해결)
interface TravelSchedule {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  dDay: string;
  bgImage?: string;
}

// 2. DB에서 넘어오는 데이터 타입 명시 (에러 32번 'any' 해결)
interface DBSchedule {
  id: string;
  title: string;
  region: string;
  start_date: string;
  end_date: string;
}

interface ScheduleListProps {
  userId: string;
  onNavigate: (page: string) => void;
}

export default function ScheduleList({
  userId,
  onNavigate,
}: ScheduleListProps) {
  const [schedules, setSchedules] = useState<TravelSchedule[]>([]);

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:5000/api/schedules/active/${userId}`)
      .then((res) => res.json())
      .then((data: DBSchedule[]) => {
        // data를 DBSchedule 배열로 타이핑하여 any 제거
        const formattedSchedules = data.map((item) => {
          // D-Day 계산 로직
          const today = new Date();
          // 시간을 자정으로 맞춰서 순수 날짜만 비교
          today.setHours(0, 0, 0, 0);
          const start = new Date(item.start_date);
          start.setHours(0, 0, 0, 0);

          const diffTime = start.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
            startDate: item.start_date.split("T")[0],
            endDate: item.end_date.split("T")[0],
            dDay: dDayString,
          };
        });
        setSchedules(formattedSchedules);
      })
      .catch((err) => console.error("일정 로드 오류:", err));
  }, [userId]);

  return (
    <div className="flex-col-full gap-5">
      {/* 헤더 */}
      <div className="flex justify-between items-center px-1 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1>나의 여행 일정</h1>
          <p className="text-body-main text-slate-400">
            다음 여행을 계획하고 기억을 만들어보세요
          </p>
        </div>
        <button
          onClick={() => onNavigate("schedule")}
          className="btn btn-custom h-10 px-5 bg-primary hover:bg-teal-700 text-white transition-all shrink-0"
        >
          <h3 className="text-white font-bold">+ 새 일정 추가</h3>
        </button>
      </div>

      {/* 카드 리스트 컨테이너 */}
      <div className="flex-1 h-0 overflow-y-auto pt-2 pb-4 px-2 scrollbar">
        <div className="flex flex-wrap gap-5">
          {/* 기존 일정 카드 리스트 렌더링 */}
          {schedules.map((schedule, index) => {
            const isFirst = index === 0;

            return (
              <div
                key={schedule.id}
                className={`shrink-0 transition-all duration-300 ${
                  isFirst ? "w-full h-80" : "w-full 2xl:w-[calc(50%-10px)] h-64"
                }`}
              >
                <div className="w-full h-full">
                  <ScheduleCard schedule={schedule} onNavigate={onNavigate} />
                </div>
              </div>
            );
          })}

          {/* 일정 추가 카드 */}
          <div
            className={`box-custom shrink-0 transition-all duration-300 border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 overflow-hidden 
              ${
                schedules.length === 0
                  ? "w-full h-80"
                  : "w-full 2xl:w-[calc(50%-10px)] h-64"
              }`}
          >
            <button
              onClick={() => onNavigate("schedule")}
              className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-slate-600 transition-all group rounded-[inherit]"
            >
              <span className="text-number-accent font-light p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center w-12 h-12 border border-slate-100">
                +
              </span>
              <span className="text-body-main">새로운 여행 일정 추가하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. 에러 111번의 원인이었던 getInitialSchedules 함수는 더 이상 필요하지 않으므로 완전히 삭제했습니다.
