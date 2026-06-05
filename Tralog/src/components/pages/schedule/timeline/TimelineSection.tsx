// TimelineSection.tsx - 타임라인 섹션
// 일차별 장소 목록을 보여주고, 편집 모드에서 장소 추가/삭제/메모/비용 입력을 지원합니다.
// 일차 버튼을 클릭해서 해당 날의 일정만 볼 수 있습니다.

import { useState, useEffect } from "react";
import PlaceItemCard from "./PlaceItemCard";
import PlaceSearchBox from "./PlaceSearchBox";
import { API_BASE_URL } from "../../../../config/api";

export interface TimelineExpense {
  detail: string;
  amount: number;
  category: string;
}

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

  // 시작일과 종료일로 총 여행 일수를 계산합니다
  let totalDays = 1;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalDays = Math.max(diff, 1);
  }

  const currentDay = day > totalDays ? totalDays : day;

  // 컴포넌트가 처음 렌더링될 때 장소 목록을 불러옵니다
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

  // 장소가 추가됐을 때 목록에 바로 반영하고 지도에도 알립니다
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
        setAllItems((prev) => prev.map((item) => (item.id === id ? { ...item, memo } : item)));
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

  // 네이버 지도 길찾기 URL을 만들어서 새 탭으로 엽니다
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

  // 현재 선택된 일차의 장소만 시간 순으로 정렬해서 보여줍니다
  const filteredItems = allItems
    .filter((item) => item.day_number === currentDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-5 h-full flex flex-col gap-4 overflow-hidden">
      {/* 일차 선택 버튼 */}
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

      {/* 장소 목록 (타임라인 형태) */}
      <div className="flex-1 overflow-y-auto scrollbar">
        <div className="relative min-h-full px-2 py-2">
          {/* 세로 타임라인 선 */}
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200 rounded-full" />

          <div className="flex flex-col gap-1 relative z-10">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <span className="loading loading-spinner loading-md text-primary" />
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

                    {/* 다음 장소가 있으면 길찾기 버튼 표시 */}
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

      {/* 편집 모드에서만 장소 검색/추가 폼을 보여줍니다 */}
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
