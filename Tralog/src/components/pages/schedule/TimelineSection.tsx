import { useState, useEffect } from "react";
import PlaceItemCard from "./PlaceItemCard";
import { API_BASE_URL } from "../../../config/api";

interface TimelineExpense {
  detail: string;
  amount: number;
  category: string;
}

interface TimelineItem {
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

interface SearchResultItem {
  place_name: string;
  y: number;
  x: number;
}

interface NaverSearchResult {
  place_name: string;
  mapx: string;
  mapy: string;
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
  onPlaceAdded?: (place: PlaceMarkerEvent) => void;
}

export default function TimelineSection({
  scheduleId,
  isEditing,
  startDate,
  endDate,
  onPlaceAdded,
}: TimelineSectionProps) {
  const [day, setDay] = useState<number>(1);
  const [allItems, setAllItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newTime, setNewTime] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(
    null,
  );

  let totalDays = 1;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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

        const mapped: TimelineItem[] = (data.places || []).map(
          (p: ApiPlaceData) => ({
            id: p.id,
            time: p.visit_time,
            place: p.place_name,
            day_number: p.day_number,
            memo: p.memo,
            expenses: [],
            lat: p.lat ? Number(p.lat) : undefined,
            lng: p.lng ? Number(p.lng) : undefined,
          }),
        );

        if (isMounted) setAllItems(mapped);
      } catch (err) {
        console.error("타임라인 로딩 실패:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchPlaces();
    return () => {
      isMounted = false;
    };
  }, [scheduleId]);

  const handleSearchPlace = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/places/search?query=${encodeURIComponent(query)}`,
      );
      if (!res.ok) return;
      const data = await res.json();

      const cleaned: SearchResultItem[] = (data.results || []).map(
        (r: NaverSearchResult) => ({
          ...r,
          place_name: r.place_name.replace(/<[^>]*>?/gm, ""),
        }),
      );
      setSearchResults(cleaned);
      setShowSearchResults(cleaned.length > 0);
    } catch (err) {
      console.error("장소 검색 실패:", err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime.trim() || !newPlace.trim())
      return alert("시간과 장소를 모두 입력해주세요.");
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime))
      return alert("시간 형식: 09:30");

    let target = selectedResult;
    if (!target && searchResults.length > 0) target = searchResults[0];
    if (!target) return alert("검색 결과가 없습니다.");

    const newId = `p-${Date.now()}`;
    const newItem: TimelineItem = {
      id: newId,
      time: newTime,
      place: target.place_name,
      day_number: currentDay,
      expenses: [],
      lat: target.y,
      lng: target.x,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId,
          schedule_id: scheduleId,
          day_number: currentDay,
          visit_time: newTime,
          place_name: target.place_name,
          lat: target.y,
          lng: target.x,
        }),
      });
      if (res.ok) {
        setAllItems((prev) => [...prev, newItem]);
        if (onPlaceAdded) {
          onPlaceAdded({
            id: newId,
            place_name: target.place_name,
            visit_time: newTime,
            day_number: currentDay,
            lat: target.y,
            lng: target.x,
          });
        }
        setNewTime("");
        setNewPlace("");
        setSelectedResult(null);
        setSearchResults([]);
      }
    } catch (err) {
      console.error("장소 추가 실패:", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/places/${id}`, {
        method: "DELETE",
      });
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
          prev.map((item) => (item.id === id ? { ...item, memo } : item)),
        );
      }
    } catch (err) {
      console.error("메모 수정 실패:", err);
    }
  };

  const handleAddExpense = async (
    placeId: string,
    detail: string,
    amount: number,
    category: string,
  ) => {
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
            ? {
                ...item,
                expenses: [
                  ...(item.expenses || []),
                  { detail, amount, category },
                ],
              }
            : item,
        ),
      );
    } catch (err) {
      console.error("가계부 추가 실패:", err);
    }
  };

  // 💡 수정됨: 네이버 지도 파라미터 규칙에 맞게 쉼표(,,) 추가 및 포맷 최적화
  const handleOpenDirections = (start: TimelineItem, end: TimelineItem) => {
    const getRoutingParam = (item: TimelineItem) => {
      const name = encodeURIComponent(item.place);
      
      // 네이버 지도는 [경도,위도,이름,장소ID,주소여부] 5가지를 요구합니다.
      // 뒤에 빈 쉼표(,,)를 붙여주어야 인식 오류가 발생하지 않습니다.
      if (item.lng && item.lat && item.lng > 120 && item.lng < 135) {
        return `${item.lng},${item.lat},${name},,`; 
      }
      return `-,-,${name},,`;
    };

    const startParam = getRoutingParam(start);
    const endParam = getRoutingParam(end);
    
    // 대중교통(-/transit) 기본 탭으로 길찾기 오픈
    const url = `https://map.naver.com/p/directions/${startParam}/${endParam}/-/transit`;
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

      <div className="flex-1 overflow-y-auto px-2 relative py-2 scrollbar">
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

      {isEditing && (
        <form
          onSubmit={handleAddItem}
          className="flex gap-2 shrink-0 bg-slate-50 p-3 rounded-4xl border border-slate-200 relative"
        >
          <input
            type="text"
            placeholder="09:00"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            maxLength={5}
            className="w-16 h-10 px-2 text-center text-xs font-bold input-custom focus:outline-none"
          />

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="장소를 검색해보세요"
              value={newPlace}
              onChange={(e) => {
                setNewPlace(e.target.value);
                setSelectedResult(null);
                handleSearchPlace(e.target.value);
              }}
              className="w-full h-10 px-3 text-xs input-custom focus:outline-none"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 box-white border border-slate-200 shadow-card z-50 max-h-48 overflow-y-auto scrollbar">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedResult(result);
                      setNewPlace(result.place_name);
                      setShowSearchResults(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-xs font-medium text-slate-700 transition-colors"
                  >
                    📍 {result.place_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary h-10 px-4 text-xs shrink-0"
          >
            등록
          </button>
        </form>
      )}
    </div>
  );
}