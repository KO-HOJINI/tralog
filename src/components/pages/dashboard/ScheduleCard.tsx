// ===================================================
// ScheduleCard.tsx - 여행 일정 카드 컴포넌트
//
// 카드 클릭 시 해당 일정 ID를 localStorage에 저장 후 편집 페이지로 이동
// bgImage가 있으면 배경 이미지, 없으면 teal 기본 배경
// ===================================================

interface TravelSchedule {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  dDay: string;
  bgImage?: string;
}

interface ScheduleCardProps {
  schedule: TravelSchedule;
  onNavigate: (page: string, scheduleId?: string) => void;
}

export default function ScheduleCard({ schedule, onNavigate }: ScheduleCardProps) {
  const handleClick = () => {
    // 클릭한 카드의 일정 ID 저장 → 편집 페이지에서 불러옴
    localStorage.setItem("tralog_active_schedule_id", schedule.id);
    onNavigate("handleschedule", schedule.id);
  };

  return (
    <div
      onClick={handleClick}
      className="box-white hover:border-primary/40 hover:scale-[1.004] transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative group w-full h-full min-h-36"
    >
      {/* 배경 이미지 + 그라데이션 오버레이 영역 */}
      <div
        className="flex-1 h-0 w-full relative p-5 flex flex-col justify-end bg-teal-50 overflow-hidden border-b border-slate-200/40 rounded-t-4xl"
        style={{
          backgroundImage: schedule.bgImage ? `url(${schedule.bgImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 아래쪽 어둡게 처리 → 텍스트 가독성 */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 group-hover:from-black/85 transition-all duration-300" />

        {/* D-Day 뱃지 */}
        <div className="absolute top-5 right-5 box-white rounded-full px-4 py-1 shadow-card z-20">
          <p className="text-number-accent tracking-tight text-dark font-black text-sm">
            {schedule.dDay}
          </p>
        </div>

        {/* 여행 제목 + 장소 */}
        <div className="relative z-10 flex flex-col gap-1 text-white select-none">
          <h1 className="tracking-tight text-white font-extrabold text-xl filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            {schedule.title}
          </h1>
          <div className="flex items-center gap-1 mt-0.5 opacity-95">
            <span className="text-sm drop-shadow-xs">📍</span>
            <p className="text-body-main font-bold tracking-wide text-slate-100 text-xs filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              {schedule.location}
            </p>
          </div>
        </div>
      </div>

      {/* 날짜 영역 */}
      <div className="bg-pure-white py-3 px-5 flex flex-row items-center gap-2 select-none border-t border-slate-50">
        <span className="text-sm">📅</span>
        <p className="text-body-main font-bold tracking-wide text-slate-600 text-xs mt-0.5">
          {schedule.startDate.replace(/-/g, ".")} ~ {schedule.endDate.replace(/-/g, ".")}
        </p>
      </div>
    </div>
  );
}
