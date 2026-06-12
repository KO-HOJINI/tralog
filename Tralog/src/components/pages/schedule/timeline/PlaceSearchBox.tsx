// PlaceSearchBox.tsx - 장소 검색 및 추가 폼
// 타임라인 편집 모드 하단에 표시
// 네이버 장소 검색 API로 실시간 검색 결과를 드롭다운으로 표시
//
// ※ AI 도움 - 검색 결과 장소명에 섞인 <b> 같은 HTML 태그를
//   정규식으로 제거: replace(/<[^>]*>?/gm, "")

import { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "../../../../config/api";
import type { TimelineItem } from "./TimelineSection";

interface SearchResultItem {
  place_name: string;
  y: number;
  x: number;
  address: string;
}

interface NaverSearchResult {
  place_name: string;
  x: number;
  y: number;
  address: string;
  roadAddress: string;
}

interface PlaceSearchBoxProps {
  scheduleId: string;
  currentDay: number;
  region?: string;
  onSuccess: (newItem: TimelineItem) => void;
}

export default function PlaceSearchBox({
  scheduleId,
  currentDay,
  region,
  onSuccess,
}: PlaceSearchBoxProps) {
  // 입력 폼 값 (시간/장소 텍스트)
  const [newTime, setNewTime] = useState("");
  const [newPlace, setNewPlace] = useState("");

  // 검색 드롭다운 상태 - 결과 목록, 표시 여부, 사용자가 고른 항목
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(
    null,
  );

  // 입력이 멈춘 뒤에만 검색하도록 디바운스 타이머 보관
  const searchTimerRef = useRef<number | null>(null);

  // 언마운트 시 대기 중인 검색 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // 입력 변경 - 300ms 디바운스 후 검색 (매 키 입력마다 API 호출하지 않도록)
  const handlePlaceInputChange = (value: string) => {
    setNewPlace(value);
    setSelectedResult(null);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimerRef.current = window.setTimeout(() => {
      void handleSearchPlace(value);
    }, 300);
  };

  // 장소 검색 - 지역명을 앞에 붙여 정확도 높임, 결과의 HTML 태그 제거
  const handleSearchPlace = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const enhancedQuery = region ? `${region} ${query}` : query;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/places/search?query=${encodeURIComponent(enhancedQuery)}`,
      );
      if (!res.ok) return;
      const data = await res.json();

      const cleaned: SearchResultItem[] = (data.results || []).map(
        (r: NaverSearchResult) => ({
          place_name: r.place_name.replace(/<[^>]*>?/gm, ""),
          x: r.x,
          y: r.y,
          address: r.address,
        }),
      );
      setSearchResults(cleaned);
      setShowSearchResults(cleaned.length > 0);
    } catch (err) {
      console.error("장소 검색 실패:", err);
    }
  };

  // 장소 추가 - 시간 형식 검증 후 선택한 장소를 타임라인/서버에 등록
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
        onSuccess(newItem);
        setNewTime("");
        setNewPlace("");
        setSelectedResult(null);
        setSearchResults([]);
      }
    } catch (err) {
      console.error("장소 추가 실패:", err);
    }
  };

  return (
    <form
      onSubmit={handleAddItem}
      className="flex gap-2 shrink-0 bg-slate-50 p-3 rounded-4xl border border-slate-200 relative mt-2"
    >
      {/* 방문 시간 입력 (HH:MM) */}
      <input
        type="text"
        placeholder="09:00"
        value={newTime}
        onChange={(e) => setNewTime(e.target.value)}
        maxLength={5}
        className="w-16 h-10 px-2 text-center text-xs font-bold input-custom focus:outline-none"
      />

      {/* 장소 검색 입력 + 결과 드롭다운 */}
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="장소를 검색해보세요"
          value={newPlace}
          onChange={(e) => handlePlaceInputChange(e.target.value)}
          className="w-full h-10 px-3 text-xs input-custom focus:outline-none"
        />
        {/* 검색 결과 목록 - 클릭 시 해당 장소를 선택값으로 채움 */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 right-0 box-white border border-slate-200 shadow-card z-50 max-h-60 overflow-y-auto overscroll-contain scrollbar">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedResult(result);
                  setNewPlace(result.place_name);
                  setShowSearchResults(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex flex-col gap-0.5"
              >
                <span className="text-xs font-bold text-slate-700">
                  📍 {result.place_name}
                </span>
                {result.address && (
                  <span className="text-[10px] text-slate-400 pl-4">
                    {result.address}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 타임라인에 장소 등록 */}
      <button type="submit" className="btn-primary h-10 px-4 text-xs shrink-0">
        등록
      </button>
    </form>
  );
}
