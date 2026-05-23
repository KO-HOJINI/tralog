interface PlaceItemCardProps {
  id: string;
  time: string;
  place: string;
  isEditing: boolean;
  onDelete: (id: string) => void;
}

export default function PlaceItemCard({
  id,
  time,
  place,
  isEditing,
  onDelete,
}: PlaceItemCardProps) {
  return (
    <div className="relative group/card flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3.5 rounded-xl transition-all">
      {/* 타임라인 축과 연결되는 가상 원 인디케이터 */}
      <div className="absolute -left-5.75 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-pure-white group-hover/card:scale-125 transition-transform" />

      {/* 콘텐츠 정보 */}
      <div className="flex items-baseline gap-3 select-none">
        <span className="text-xs font-black text-primary tracking-tight shrink-0 font-mono">
          {time}
        </span>
        <h3 className="text-xs font-bold text-dark m-0 leading-tight">
          {place}
        </h3>
      </div>

      {/* 일정편집 모드 활성화 시에만 우측에 나타나는 삭제 인터랙션 제어 */}
      {isEditing && (
        <button
          onClick={() => onDelete(id)}
          className="w-5 h-5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center font-bold text-[10px] border-none shrink-0 transition-colors cursor-pointer"
          title="장소 삭제"
        >
          ✕
        </button>
      )}
    </div>
  );
}
