// ===================================================
// TimelineSection.tsx - 타임라인 일정 섹션
//
// 백엔드 API:
//   GET  /api/schedules/:id         → 전체 일정 데이터 (places 포함)
//   POST /api/places                → 장소 추가
//   PUT  /api/places/:id            → 메모 수정
//   DELETE /api/places/:id          → 장소 삭제
//   POST /api/expenses              → 가계부 등록
//   GET  /api/places/search?query=  → 네이버 장소 검색
//
// 피그마 디자인 반영:
//   - 일차 탭: rounded-full pill 스타일
//   - 타임라인 세로선: 좌측 고정
//   - 장소 입력 폼: 하단 sticky
//
// 🐛 Fix: 비용을 PlaceItemCard에 초기값(expenses)으로 내려줌
//   → 카드 내부 localExpenses에서 즉시 렌더링
//
// AI 도움:
//   - 날짜 기반 totalDays 계산
//   - isMounted 패턴으로 언마운트 후 setState 방지
// ===================================================

import { useState, useEffect } from "react";
import PlaceItemCard from "./PlaceItemCard";
import { API_BASE_URL } from "../../../config/api";

interface TimelineItem {
  id: string;
  time: string;
  place: string;
  day_number: number;
  memo?: string;
  expenses?: { detail: string; amount: number }[]; // 카드에 표시할 비용 목록
}

interface ApiPlaceData {
  id: string;
  visit_time: string;
  place_name: string;
  day_number: number;
  memo?: string;
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

  // 새 장소 추가 폼 상태
  const [newTime, setNewTime] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);

  // 여행 총 일수 계산 (AI 도움)
  let totalDays = 1;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalDays = Math.max(diff, 1);
  }

  // 날짜가 줄어들면 현재 일차 자동 보정
  const currentDay = day > totalDays ? totalDays : day;

  // 장소 목록 불러오기
  useEffect(() => {
    let isMounted = true; // AI 도움: 언마운트 후 setState 방지

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
          expenses: [], // 초기엔 빈 배열, 카드에서 직접 추가됨
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

  // 장소 검색 (네이버 API)
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

      // HTML 태그 제거 (네이버 검색 결과에 <b> 태그 포함됨)
      const cleaned: SearchResultItem[] = (data.results || []).map((r: NaverSearchResult) => ({
        ...r,
        place_name: r.place_name.replace(/<[^>]*>?/gm, ""),
      }));
      setSearchResults(cleaned);
      setShowSearchResults(cleaned.length > 0);
    } catch (err) {
      console.error("장소 검색 실패:", err);
    }
  };

  // 장소 추가
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime.trim() || !newPlace.trim()) return alert("시간과 장소를 모두 입력해주세요.");
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime)) return alert("시간 형식: 09:30");

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

  // 장소 삭제
  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/places/${id}`, { method: "DELETE" });
      if (res.ok) setAllItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("장소 삭제 실패:", err);
    }
  };

  // 메모 수정
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

  // 비용 추가 (가계부 API 호출)
  // placeId를 받아서 allItems의 해당 카드 expenses에도 추가
  const handleAddExpense = async (placeId: string, detail: string, amount: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `acc-${Date.now()}`,
          schedule_id: scheduleId,
          category: "기타",
          detail,
          amount,
        }),
      });
      // PlaceItemCard 내부 localExpenses에도 반영은 카드에서 처리함
    } catch (err) {
      console.error("가계부 추가 실패:", err);
    }
  };

  // 현재 일차 아이템만 필터 + 시간순 정렬
  const filteredItems = allItems
    .filter((item) => item.day_number === currentDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-5 h-full flex flex-col gap-4 overflow-hidden">

      {/* 일차 탭 */}
      <div className="flex gap-2 shrink-0 select-none overflow-x-auto pb-1">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap border ${
              currentDay === d
                ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {d}일차
          </button>
        ))}
      </div>

      {/* 타임라인 리스트 */}
      <div className="flex-1 overflow-y-auto px-2 relative py-2 scrollbar">
        {/* 세로 타임라인 축 */}
        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200 rounded-full" />

        <div className="flex flex-col gap-4 relative z-10">
          {isLoading ? (
            <div className="text-center text-xs text-slate-400 py-10 animate-pulse">
              일정을 불러오는 중입니다...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10">
              {currentDay}일차에 등록된 장소가 없어요. 아래에서 추가해보세요!
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <PlaceItemCard
                key={item.id}
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
            ))
          )}
        </div>
      </div>

      {/* 장소 추가 입력 폼 (편집 모드에서만 표시) */}
      {isEditing && (
        <form
          onSubmit={handleAddItem}
          className="flex gap-2 shrink-0 bg-slate-50 p-3 rounded-2xl border border-slate-200 relative"
        >
          {/* 시간 입력 */}
          <input
            type="text"
            placeholder="09:00"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            maxLength={5}
            className="w-16 h-10 px-2 text-center text-xs font-bold input-custom focus:outline-none"
          />

          {/* 장소 검색 */}
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
            {/* 검색 결과 드롭다운 */}
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

          <button type="submit" className="btn-dark h-10 px-4 text-xs shrink-0">
            등록
          </button>
        </form>
      )}
    </div>
  );
}
