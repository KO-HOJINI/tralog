import { useState } from "react";
import ScheduleCard from "./ScheduleCard";

interface TravelSchedule {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  dDay: string;
  bgImage?: string;
}

interface ScheduleListProps {
  userId: string;
  onNavigate: (page: string) => void;
}

export default function ScheduleList({
  userId,
  onNavigate,
}: ScheduleListProps) {
  const [prevUserId, setPrevUserId] = useState<string>(userId);
  const [schedules, setSchedules] = useState<TravelSchedule[]>(() =>
    getInitialSchedules(userId),
  );

  if (userId !== prevUserId) {
    setPrevUserId(userId);
    setSchedules(getInitialSchedules(userId));
  }

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
              {/* 🛠️ text-number-accent 유틸리티 매핑 */}
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

function getInitialSchedules(userId: string): TravelSchedule[] {
  const key = `tralog_schedules_${userId}`;
  const stored = localStorage.getItem(key);
  let parsed: TravelSchedule[] = [];

  if (stored) {
    try {
      parsed = JSON.parse(stored);
    } catch {
      parsed = [];
    }
  }

  const isOldData =
    parsed.length > 0 &&
    (parsed.length !== 4 || !parsed[0].dDay || !parsed[0].bgImage);

  if (parsed.length === 0 || isOldData || userId === "admin") {
    const mockSchedules: TravelSchedule[] = [
      {
        id: "s-1",
        title: "에메랄드빛 제주 바다 여행",
        location: "제주특별자치도 제주시 협재",
        startDate: "2026-06-15",
        endDate: "2026-06-18",
        dDay: "D-23",
        bgImage:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "s-2",
        title: "고즈넉한 경주 야경 산책",
        location: "경상북도 경주시",
        startDate: "2026-09-04",
        endDate: "2026-09-06",
        dDay: "D-104",
        bgImage:
          "https://images.unsplash.com/photo-1624956578877-2e11e03214bc?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "s-3",
        title: "부산 광안리 해변과 식도락 투어",
        location: "부산광역시 수영구",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        dDay: "D-140",
        bgImage:
          "https://images.unsplash.com/photo-1578052445100-3486df1f524d?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "s-4",
        title: "강릉 안목해변 커피거리 휴가",
        location: "강원특별자치도 강릉시",
        startDate: "2026-11-20",
        endDate: "2026-11-22",
        dDay: "D-181",
        bgImage:
          "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=600&q=80",
      },
    ];
    localStorage.setItem(key, JSON.stringify(mockSchedules));
    return mockSchedules;
  }

  return parsed;
}
