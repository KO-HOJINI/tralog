// ===================================================
// ScheduleCard.tsx - 여행 일정 카드 컴포넌트
//
// 마이맵 연동 반영:
//   - bgImage 프로퍼티에 마이맵 페이지(PhotoGrid)에서
//     [대표사진 선택]으로 저장한 coverImage 데이터를 매핑해 렌더링합니다.
//   - 대표사진이 없을 경우 Tralog의 시그니처 테마인 부드러운 민트 그라데이션이 노출됩니다.
// ===================================================

import { API_BASE_URL } from "../../../config/api";

interface TravelSchedule {
  id: string;
  title: string;
  location: string; // 일정의 지역명 (예: "서울특별시", "제주특별자치도")
  startDate: string;
  endDate: string;
  dDay: string;
  bgImage?: string; // 📸 마이맵의 'coverImage' 데이터를 여기에 매핑하여 전달받음
}

interface ScheduleCardProps {
  schedule: TravelSchedule;
  onNavigate: (page: string, scheduleId?: string) => void;
}

export default function ScheduleCard({
  schedule,
  onNavigate,
}: ScheduleCardProps) {
  const handleClick = () => {
    // 클릭한 카드의 일정 ID 저장 → 편집 페이지에서 불러옴
    localStorage.setItem("tralog_active_schedule_id", schedule.id);
    onNavigate("handleschedule", schedule.id);
  };

  // 💡 백엔드 이미지 주소 가공 가이드 (PhotoGrid.tsx의 가공 방식과 동기화)
  const getBackgroundImageSrc = () => {
    if (!schedule.bgImage) return "";
    // base64 데이터형식이거나 이미 풀 주소인 경우 그대로 반환
    if (
      schedule.bgImage.startsWith("data:") ||
      schedule.bgImage.startsWith("http")
    ) {
      return schedule.bgImage;
    }
    // 상대 경로로 들어올 경우 API 베이스 주소 결합
    return `${API_BASE_URL}${schedule.bgImage}`;
  };

  const bgSrc = getBackgroundImageSrc();

  return (
    <div
      onClick={handleClick}
      className="box-white hover:border-primary/40 hover:scale-[1.004] transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative group w-full h-full min-h-36"
    >
      {/* 배경 이미지 영역 */}
      <div
        className="flex-1 h-0 w-full relative p-5 flex flex-col justify-end overflow-hidden border-b border-slate-200/40 rounded-t-4xl transition-all duration-300"
        style={{
          // 💡 마이맵에서 선택한 대표사진(bgSrc)이 존재하면 보여주고, 없으면 UI 기조에 맞는 은은한 민트 그라데이션 적용
          backgroundImage: bgSrc
            ? `url(${bgSrc})`
            : "linear-gradient(135deg, #e6f7f4 0%, #cbece7 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >

        {/* D-Day 뱃지 */}
        <div className="absolute top-4 right-4 box-white rounded-full px-3.5 py-1 shadow-card z-20">
          <p className="text-number-accent tracking-tight text-dark font-black text-xs">
            {schedule.dDay}
          </p>
        </div>

        {/* 여행 제목 + 장소 */}
        <div className="relative z-10 flex flex-col gap-0.5 text-white select-none">
          <h1 className="tracking-tight text-white font-extrabold text-lg filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.6)]">
            {schedule.title}
          </h1>
          <div className="flex items-center gap-1 mt-0.5 opacity-95">
            <span className="text-xs drop-shadow-xs">📍</span>
            <p className="text-body-main font-bold tracking-wide text-slate-100 text-[11px] filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {schedule.location}
            </p>
          </div>
        </div>
      </div>

      {/* 날짜 영역 */}
      <div className="bg-pure-white py-3 px-5 flex flex-row items-center gap-2 select-none border-t border-slate-50">
        <span className="text-sm">📅</span>
        <p className="text-body-main font-bold tracking-wide text-slate-600 text-xs mt-0.5">
          {schedule.startDate.replace(/-/g, ".")} ~{" "}
          {schedule.endDate.replace(/-/g, ".")}
        </p>
      </div>
    </div>
  );
}
