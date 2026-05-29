// src/components/pages/schedule/TimelineSection.tsx
import { useState, useEffect } from "react";
import PlaceItemCard from "./PlaceItemCard";
import { API_BASE_URL } from "../../../config/api";

interface TimelineItem {
  id: string;
  time: string;
  place: string;
  day_number: number;
  memo?: string;
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

interface PlaceMarkerEvent {
  id: string;
  place_name: string;
  day_number: number;
  visit_time: string;
  lat: number;
  lng: number;
}

interface NaverSearchResult {
  place_name: string;
  mapx: string;
  mapy: string;
  address?: string;
  roadAddress?: string;
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
  // 현재 사용자가 선택해서 보고 있는 일차 탭 상태
  const [day, setDay] = useState<number>(1);
  // 서버에서 받아온 전체 일정 아이템 리스트 상태
  const [allItems, setAllItems] = useState<TimelineItem[]>([]);
  // 로딩 애니메이션 노출 여부 상태
  const [isLoading, setIsLoading] = useState(true);

  // 새로운 장소 추가 폼 입력 상태들
  const [newTime, setNewTime] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] =
    useState<SearchResultItem | null>(null);

  // 부모에게 받아온 시작일과 종료일 데이터를 기반으로 총 여행 일수를 실시간 계산
  let totalDays = 1;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalDays = Math.max(days, 1);
  }

  // ✅ 해결 포인트: useEffect로 setDay를 호출하지 않고, 렌더링에 쓸 안전한 현재 일차값을 직접 산출
  // 만약 날짜 수정으로 인해 총 일수가 선택된 일수보다 작아지면 자동으로 마지막 일차를 바라보게 처리
  const currentDay = day > totalDays ? totalDays : day;

  // 컴포넌트가 처음 열릴 때 데이터베이스에서 해당 일정의 장소 목록을 호출
  useEffect(() => {
    let isMounted = true;
    const fetchPlaces = async () => {
      if (!scheduleId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) throw new Error("일정 데이터 로드 실패");
        const data = await res.json();
        const mapped = (data.places || []).map((p: ApiPlaceData) => ({
          id: p.id,
          time: p.visit_time,
          place: p.place_name,
          day_number: p.day_number,
          memo: p.memo,
        }));
        if (isMounted) setAllItems(mapped);
      } catch (err) {
        console.error("타임라인 동선 로딩 실패:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchPlaces();
    return () => {
      isMounted = false;
    };
  }, [scheduleId]);

  // 키워드를 입력할 때마다 백엔드의 네이버 검색 API 허브를 호출하는 핸들러
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

      const cleaned = (data.results || []).map((r: NaverSearchResult) => ({
        ...r,
        place_name: r.place_name.replace(/<[^>]*>?/gm, ""), // 검색 텍스트 강조용 태그 삭제
      }));
      setSearchResults(cleaned);
      setShowSearchResults(cleaned.length > 0);
    } catch (err) {
      console.error("장소 연동 검색 실패:", err);
    }
  };

  // 장소 추가 폼 전송 이벤트를 처리하는 핸들러
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime.trim() || !newPlace.trim())
      return alert("시간과 장소를 모두 입력해주세요.");
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime))
      return alert("시간 형식을 올바르게 맞춰주세요 (예: 09:30)");

    let target = selectedSearchResult;
    if (!target && searchResults.length > 0) target = searchResults[0];
    if (!target) return alert("검색 결과가 존재하지 않습니다.");

    const newId = `p-${Date.now()}`;
    const newItem = {
      id: newId,
      time: newTime,
      place: target.place_name,
      day_number: currentDay, // 보정된 안전한 일차값 적용
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
        setSelectedSearchResult(null);
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 장소 카드를 삭제할 때 가동되는 핸들러
  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/places/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setAllItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // 장소 카드 내부에서 인라인 메모를 저장할 때 가동되는 핸들러
  const handleUpdateMemo = async (id: string, memo: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/places/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo }),
      });
      if (res.ok)
        setAllItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, memo } : item)),
        );
    } catch (err) {
      console.error(err);
    }
  };

  // 장소 카드 내부에서 인라인 비용을 가계부에 바로 올릴 때 가동되는 핸들러
  const handleAddExpense = async (detail: string, amount: number) => {
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
      alert(`[가계부 기록 완료] ${detail} : ${amount.toLocaleString()}원 💳`);
    } catch (err) {
      console.error(err);
    }
  };

  // 보정된 현재 일차(currentDay) 아이템만 필터링한 후 시간순으로 오름차순 정렬
  const filteredItems = allItems
    .filter((item) => item.day_number === currentDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-6 h-full flex flex-col gap-5 overflow-hidden">
      {/* n일차 상단 수평 탭 컨트롤러 컴포넌트 */}
      <div className="flex gap-2 shrink-0 select-none overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)} // 탭을 클릭하면 명시적으로 해당 일차 상태 저장
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors whitespace-nowrap border ${
              currentDay === d
                ? "bg-slate-700 text-white border-slate-700"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {d}일차
          </button>
        ))}
      </div>

      {/* 동선 타임라인 메인 리스트 뷰 영역 */}
      <div className="flex-1 overflow-y-auto px-2 relative py-2 scrollbar">
        {/* 수직 타임라인 타임 축 구현선 */}
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200 rounded-full" />

        <div className="flex flex-col gap-5 relative z-10">
          {isLoading ? (
            <div className="text-center text-xs text-slate-400 py-10">
              일정을 불러오는 중입니다...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-10">
              {currentDay}일차에 등록된 일정이 없습니다. 아래에서 장소를
              추가해보세요!
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
                onDelete={handleDeleteItem}
                onUpdateMemo={handleUpdateMemo}
                onAddExpense={handleAddExpense}
              />
            ))
          )}
        </div>
      </div>

      {/* 하단 장소 및 시간 추가 입력 폼 레이아웃 (일정편집 모드가 켜진 경우에만 활성화) */}
      {isEditing && (
        <form
          onSubmit={handleAddItem}
          className="flex gap-2 shrink-0 bg-slate-50 p-3 rounded-2xl border border-slate-200 relative"
        >
          <input
            type="text"
            placeholder="09:00"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            maxLength={5}
            className="w-16 h-10 px-2 text-center text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
          />
          <div className="flex-1 relative overflow-visible">
            <input
              type="text"
              placeholder="장소를 검색해보세요"
              value={newPlace}
              onChange={(e) => {
                setNewPlace(e.target.value);
                setSelectedSearchResult(null);
                handleSearchPlace(e.target.value);
              }}
              className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-md z-50 max-h-52 overflow-y-auto scrollbar">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedSearchResult(result);
                      setNewPlace(result.place_name);
                      setShowSearchResults(false);
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-xs font-medium text-slate-700"
                  >
                    📍 {result.place_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="h-10 px-4 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-800 shrink-0"
          >
            등록
          </button>
        </form>
      )}
    </div>
  );
}
