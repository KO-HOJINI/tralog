// TimelineSection.tsx
import { useState, useEffect } from "react";
import PlaceItemCard from "./PlaceItemCard";
import PlaceSearchBox from "./PlaceSearchBox"; 
import { API_BASE_URL } from "../../../../config/api";

// 💡 다른 파일에서 수입해서 쓸 수 있도록 export를 붙여줍니다.
export interface TimelineExpense {
  detail: string;
  amount: number;
  category: string;
}

// 💡 다른 파일에서 수입해서 쓸 수 있도록 export를 붙여줍니다.
export interface TimelineItem {
  id: string;
  time: string;
  place: string;
  day_number: number;
  memo?: string;
  expenses?: TimelineExpense[];
  lat?: number;
  lng?: number;
}

interface ApiPlaceData {
  id: string;
  visit_time: string;
  place_name: string;
  day_number: number;
  memo?: string;
  lat?: number;
  lng?: number;
}

interface PlaceMarkerEvent {
  id: string;
  place_name: string;
  day_number: number;
  visit_time: string;
  lat: number;
  lng: number;
}

interface TimelineSectionProps {
  userId: string;
  scheduleId: string;
  isEditing: boolean;
  startDate?: string;
  endDate?: string;
  region?: string;
  onPlaceAdded?: (place: PlaceMarkerEvent) => void;
}

export default function TimelineSection({
  scheduleId,
  isEditing,
  startDate,
  endDate,
  region,
  onPlaceAdded,
}: TimelineSectionProps) {
  const [day, setDay] = useState<number>(1);
  const [allItems, setAllItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  let totalDays = 1;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalDays = Math.max(diff, 1);
  }

  const currentDay = day > totalDays ? totalDays : day;

  useEffect(() => {
    let isMounted = true;
    const fetchPlaces = async () => {
      if (!scheduleId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) throw new Error("일정 로드 실패");
        const data = await res.json();

        const mapped: TimelineItem[] = (data.places || []).map((p: ApiPlaceData) => ({
          id: p.id,
          time: p.visit_time,
          place: p.place_name,
          day_number: p.day_number,
          memo: p.memo,
          expenses: [],
          lat: p.lat ? Number(p.lat) : undefined,
          lng: p.lng ? Number(p.lng) : undefined,
        }));

        if (isMounted) setAllItems(mapped);
      } catch (err) {
        console.error("타임라인 로딩 실패:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchPlaces();
    return () => { isMounted = false; };
  }, [scheduleId]);

  const handlePlaceAddedSuccess = (newItem: TimelineItem) => {
    setAllItems((prev) => [...prev, newItem]);
    
    if (onPlaceAdded) {
      onPlaceAdded({
        id: newItem.id,
        place_name: newItem.place,
        visit_time: newItem.time,
        day_number: newItem.day_number,
        lat: newItem.lat!,
        lng: newItem.lng!,
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/places/${id}`, { method: "DELETE" });
      if (res.ok) setAllItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("장소 삭제 실패:", err);
    }
  };

  const handleUpdateMemo = async (id: string, memo: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/places/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo }),
      });
      if (res.ok) {
        setAllItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, memo } : item))
        );
      }
    } catch (err) {
      console.error("메모 수정 실패:", err);
    }
  };

  const handleAddExpense = async (placeId: string, detail: string, amount: number, category: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `acc-${Date.now()}`,
          schedule_id: scheduleId,
          category,
          detail,
          amount,
        }),
      });

      setAllItems((prev) =>
        prev.map((item) =>
          item.id === placeId
            ? { ...item, expenses: [...(item.expenses || []), { detail, amount, category }] }
            : item
        )
      );
    } catch (err) {
      console.error("가계부 추가 실패:", err);
    }
  };

  const handleOpenDirections = (start: TimelineItem, end: TimelineItem) => {
    const getRoutingParam = (item: TimelineItem) => {
      const name = encodeURIComponent(item.place);
      if (item.lng && item.lat && item.lng > 120 && item.lng < 135) {
        return `${item.lng},${item.lat},${name},,`;
      }
      return `-,-,${name},,`;
    };

    const url = `https://map.naver.com/p/directions/${getRoutingParam(start)}/${getRoutingParam(end)}/-/transit`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const filteredItems = allItems
    .filter((item) => item.day_number === currentDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-5 h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex gap-2 shrink-0 select-none overflow-x-auto pb-1">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap border ${
              currentDay === d ? "btn-ghost" : "btn-white"
            }`}
          >
            {d}일차
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar">
        <div className="relative min-h-full px-2 py-2">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200 rounded-full" />

          <div className="flex flex-col gap-1 relative z-10">
            {isLoading ? (
              <div className="text-center text-xs text-slate-400 py-10 animate-pulse">
                일정을 불러오는 중입니다...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-10">
                {currentDay}일차에 등록된 장소가 없어요. 아래에서 추가해보세요!
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const nextItem = filteredItems[index + 1];
                return (
                  <div key={item.id} className="flex flex-col">
                    <PlaceItemCard
                      id={item.id}
                      time={item.time}
                      place={item.place}
                      index={index + 1}
                      isEditing={isEditing}
                      memo={item.memo}
                      expenses={item.expenses || []}
                      onDelete={handleDeleteItem}
                      onUpdateMemo={handleUpdateMemo}
                      onAddExpense={handleAddExpense}
                    />

                    {nextItem && (
                      <div className="relative flex justify-start items-center pl-10 py-1 z-20 mt-1 mb-1">
                        <button
                          onClick={() => handleOpenDirections(item, nextItem)}
                          className="btn-secondary flex items-center gap-2 px-2.5 py-1.5"
                        >
                          <span className="text-body-caption text-white font-bold">길찾기</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <PlaceSearchBox
          scheduleId={scheduleId}
          currentDay={currentDay}
          region={region}
          onSuccess={handlePlaceAddedSuccess}
        />
      )}
    </div>
  );
}