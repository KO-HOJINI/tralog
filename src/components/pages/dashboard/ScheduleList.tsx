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
  // userId별로 독립된 스토리지 상태를 추적하기 위한 단일 상태 구조
  const [prevUserId, setPrevUserId] = useState<string>(userId);
  const [schedules, setSchedules] = useState<TravelSchedule[]>(() =>
    getInitialSchedules(userId),
  );

  // 부모로부터 새로운 userId를 받았을 때(로그인 전환 등), 이펙트 없이 즉시 상태 동기화
  if (userId !== prevUserId) {
    setPrevUserId(userId);
    setSchedules(getInitialSchedules(userId));
  }

  return (
    <div className="flex flex-col gap-5 w-full h-full overflow-hidden">
      {/* 헤더 */}
      <div className="flex justify-between items-center px-1 flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1>나의 여행 일정</h1>
          <p className="text-body-main text-slate-400">
            다음 여행을 계획하고 기억을 만들어보세요
          </p>
        </div>
        <button
          onClick={() => onNavigate("schedule")}
          className="btn btn-custom h-10 px-5 bg-primary hover:bg-teal-700 text-white transition-all box-custom flex-shrink-0 shadow-none"
        >
          <h3 className="text-white font-bold">+ 새 일정 추가</h3>
        </button>
      </div>

      {/* 카드 리스트 컨테이너 */}
      <div className="flex-1 h-0 flex flex-col gap-4 overflow-y-auto pt-2 pb-4 px-2 figma-scrollbar items-stretch">
        {schedules.length === 0 ? (
          <div className="bg-pure-white box-custom p-20 text-center border border-slate-200/50 w-full">
            <p className="text-sm text-gray font-medium">
              등록된 여행 일정이 없습니다.
            </p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="w-full min-h-24 h-64 flex-shrink-0"
            >
              <ScheduleCard schedule={schedule} onNavigate={onNavigate} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 초기 데이터 세팅 및 로컬 스토리지 연동 헬퍼 함수
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

  // 4개의 관광지 데이터 조건 체크 (길이가 다르거나 필수 필드가 없을 때 초기화)
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
