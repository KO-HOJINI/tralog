import { useState } from "react";
import PlaceItemCard from "./PlaceItemCard";

interface TimelineItem {
  id: string;
  time: string;
  place: string;
}

interface TimelineSectionProps {
  userId: string;
  isEditing: boolean;
}

export default function TimelineSection({
  isEditing,
}: TimelineSectionProps) {
  const [day, setDay] = useState<number>(1);
  const [items, setItems] = useState<TimelineItem[]>([
    { id: "p-1", time: "09:00", place: "신라호텔 제주" },
    { id: "p-2", time: "11:30", place: "오설록 티 뮤지엄" },
    { id: "p-3", time: "14:00", place: "협재 해산물 맛집" },
  ]);
  const [newTime, setNewTime] = useState("");
  const [newPlace, setNewPlace] = useState("");

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime || !newPlace) return;

    const newItem: TimelineItem = {
      id: `p-${Date.now()}`,
      time: newTime,
      place: newPlace,
    };

    setItems([...items, newItem].sort((a, b) => a.time.localeCompare(b.time)));
    setNewTime("");
    setNewPlace("");
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="box-custom bg-pure-white border border-slate-100 p-6 h-full flex flex-col gap-4 overflow-hidden">
      {/* 일차 선택 필터 */}
      <div className="flex gap-2 shrink-0 select-none">
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border ${
              day === d
                ? "bg-dark text-white border-dark"
                : "bg-pure-white text-gray border-slate-200"
            }`}
          >
            {d}일차
          </button>
        ))}
      </div>

      {/* 타임라인 메인 트랙 리스트 */}
      <div className="flex-1 overflow-y-auto pr-1 relative border-l-2 border-slate-100 pl-4 ml-2 flex flex-col gap-3 py-2">
        {items.map((item) => (
          <PlaceItemCard
            key={item.id}
            id={item.id}
            time={item.time}
            place={item.place}
            isEditing={isEditing}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>

      {/* 일정편집 모드가 true일 때만 하단 동선 입력창 노출 (Figma 기획서 규칙) */}
      {isEditing && (
        <form
          onSubmit={handleAddItem}
          className="flex gap-2 shrink-0 border-t border-slate-100 pt-3 animate-in slide-in-from-bottom-2 duration-150"
        >
          <input
            type="text"
            placeholder="00:00"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="w-16 h-10 px-2 text-center text-xs focus:outline-none input-custom"
          />
          <input
            type="text"
            placeholder="새로운 방문지 입력"
            value={newPlace}
            onChange={(e) => setNewPlace(e.target.value)}
            className="flex-1 h-10 px-3 text-xs focus:outline-none input-custom"
          />
          <button
            type="submit"
            className="h-10 px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-teal-700 shrink-0"
          >
            장소추가
          </button>
        </form>
      )}
    </div>
  );
}
