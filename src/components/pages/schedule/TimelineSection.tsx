// src/components/pages/schedule/TimelineSection.tsx
import { useState, useEffect, useCallback } from "react";
import PlaceItemCard from "./PlaceItemCard";
import { API_BASE_URL } from "../../../config/api";

interface TimelineItem {
  id: string;
  time: string;
  place: string;
  day_number: number;
}

interface TimelineSectionProps {
  userId: string;
  scheduleId: string; // ✅ 추가: 어떤 일정인지 특정하기 위해 필요
  isEditing: boolean;
  onPlaceAdded?: (place: {
    id: string;
    place_name: string;
    lat: number;
    lng: number;
    day_number: number;
    visit_time: string;
  }) => void; // ✅ 장소 추가 시 부모에 통지
}

interface NaverGeocodeAddress {
  jibunAddress?: string;
  roadAddress?: string;
  address?: string;
  y?: string;
  x?: string;
}

interface NaverGeocodeResponse {
  addresses?: NaverGeocodeAddress[];
}

interface NaverGeocodeService {
  geocode: (
    options: { query: string },
    callback: (status: string, response: NaverGeocodeResponse) => void,
  ) => void;
  Status?: { OK?: string };
}

export default function TimelineSection({
  scheduleId,
  isEditing,
  onPlaceAdded,
}: TimelineSectionProps) {
  const [day, setDay] = useState<number>(1);
  const [allItems, setAllItems] = useState<TimelineItem[]>([]);
  const [totalDays, setTotalDays] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [newTime, setNewTime] = useState("");
  const [newPlace, setNewPlace] = useState("");

  // ✅ 네이버 지도 검색 상태
  const [searchResults, setSearchResults] = useState<
    Array<{ place_name: string; y: number; x: number }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<{
    place_name: string;
    y: number;
    x: number;
  } | null>(null);

  // ✅ DB에서 일정 데이터 fetch
  const fetchPlaces = useCallback(async () => {
    if (!scheduleId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
      if (!res.ok) throw new Error("일정 로드 실패");
      const data = await res.json();

      // places 배열을 TimelineItem 형태로 매핑
      const mapped: TimelineItem[] = (data.places || []).map(
        (p: {
          id: string;
          visit_time: string;
          place_name: string;
          day_number: number;
        }) => ({
          id: p.id,
          time: p.visit_time,
          place: p.place_name,
          day_number: p.day_number,
        }),
      );

      setAllItems(mapped);

      // 일정 기간에서 총 일수 계산
      if (data.meta?.start_date && data.meta?.end_date) {
        const start = new Date(data.meta.start_date);
        const end = new Date(data.meta.end_date);
        const days =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1;
        setTotalDays(Math.max(days, 1));
      }
    } catch (err) {
      console.error("타임라인 fetch 오류:", err);
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  // ✅ 네이버 지도 검색 API를 통해 장소 검색 (가능하면 클라이언트 JS, 없으면 백엔드 Geocoding)
  const handleSearchPlace = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const naverService = (
        window as unknown as {
          naver?: { maps?: { Service?: NaverGeocodeService } };
        }
      )?.naver?.maps?.Service;
      if (naverService?.geocode) {
        naverService.geocode(
          { query },
          (status: string, response: NaverGeocodeResponse) => {
            if (
              status === (naverService.Status?.OK ?? "OK") &&
              response?.addresses
            ) {
              const formatted = response.addresses.map((addr) => ({
                place_name: addr.jibunAddress || addr.roadAddress || query,
                y: Number(addr.y),
                x: Number(addr.x),
              }));
              setSearchResults(formatted);
              setShowSearchResults(formatted.length > 0);
            } else {
              setSearchResults([]);
              setShowSearchResults(false);
            }
            setIsSearching(false);
          },
        );
        return;
      }

      const url = `${API_BASE_URL}/api/places/search?query=${encodeURIComponent(query)}`;
      console.log("🔍 검색 요청:", url);

      const res = await fetch(url);
      console.log("📨 응답 상태:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("❌ API 에러:", errorData);
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      const data = await res.json();
      console.log("📦 검색 결과:", data);

      const results = data.results || [];
      if (results.length > 0) {
        console.log("📍 첫 번째 결과 좌표:", {
          y: results[0].y,
          x: results[0].x,
        });
      }

      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (err) {
      console.error("❌ 장소 검색 오류:", err);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ✅ 검색 결과에서 장소 선택
  const handleSelectSearchResult = (result: {
    place_name: string;
    y: number;
    x: number;
  }) => {
    console.log("🎯 검색 결과 선택:", result);
    setSelectedSearchResult(result);
    setNewPlace(result.place_name);
    setShowSearchResults(false);
    setSearchResults([]);
  };

  useEffect(() => {
    const loadPlaces = async () => {
      await fetchPlaces();
    };
    void loadPlaces();
  }, [fetchPlaces]);

  // ✅ 현재 선택된 일차의 항목만 필터링 후 시간 순 정렬
  const filteredItems = allItems
    .filter((item) => item.day_number === day)
    .sort((a, b) => a.time.localeCompare(b.time));

  // ✅ 장소 추가: DB에 저장 후 로컬 상태 갱신
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime || !newPlace.trim()) return;

    // 간단한 시간 형식 검증 (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newTime)) {
      alert("시간 형식이 올바르지 않습니다. (예: 09:30)");
      return;
    }

    console.log("📝 장소 추가 시작:", { newPlace, selectedSearchResult });

    // ✅ 검색 결과에서 선택한 좌표 사용 (필수)
    if (!selectedSearchResult) {
      alert("검색 결과에서 장소를 선택해주세요. (드롭다운에서 선택)");
      console.warn("⚠️ 선택된 검색 결과가 없습니다.");
      return;
    }

    const lat = selectedSearchResult.y;
    const lng = selectedSearchResult.x;

    console.log("✅ 선택된 좌표:", {
      lat,
      lng,
      place_name: selectedSearchResult.place_name,
    });

    if (!lat || !lng) {
      alert("좌표 정보가 없습니다. 다시 시도해주세요.");
      return;
    }

    const newId = `p-${Date.now()}`;
    const newItem: TimelineItem = {
      id: newId,
      time: newTime,
      place: newPlace.trim(),
      day_number: day,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId,
          schedule_id: scheduleId,
          day_number: day,
          visit_time: newTime,
          place_name: newPlace.trim(),
          lat,
          lng,
        }),
      });

      if (res.ok) {
        console.log("✅ DB에 저장 완료");
        setAllItems((prev) => [...prev, newItem]);

        // ✅ 부모에게 새 장소 통지 (마커 추가 위해)
        if (onPlaceAdded) {
          console.log("📍 마커 추가 콜백 호출:", {
            lat,
            lng,
            place_name: newPlace.trim(),
          });
          onPlaceAdded({
            id: newId,
            place_name: newPlace.trim(),
            lat,
            lng,
            day_number: day,
            visit_time: newTime,
          });
        }

        setNewTime("");
        setNewPlace("");
        setSelectedSearchResult(null);
        setSearchResults([]);
        alert("장소가 추가되었습니다!");
      } else {
        const error = await res.json();
        console.error("❌ 장소 저장 실패:", error);
        alert("장소 추가에 실패했습니다.");
      }
    } catch (err) {
      console.error("❌ 장소 추가 오류:", err);
      alert("서버 연결 오류가 발생했습니다.");
    }
  };

  // ✅ 장소 삭제: DB에서 삭제 후 로컬 상태 갱신
  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/places/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAllItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("장소 삭제 오류:", err);
    }
  };

  return (
    <div className="box-custom bg-pure-white border border-slate-100 p-6 h-full flex flex-col gap-4 overflow-hidden">
      {/* 일차 선택 필터 */}
      <div className="flex gap-2 shrink-0 select-none flex-wrap">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
              day === d
                ? "bg-dark text-white border-dark"
                : "bg-pure-white text-gray border-slate-200 hover:border-slate-300"
            }`}
          >
            {d}일차
          </button>
        ))}
      </div>

      {/* 타임라인 메인 트랙 리스트 */}
      <div className="flex-1 overflow-y-auto pr-1 relative border-l-2 border-slate-100 pl-4 ml-2 flex flex-col gap-3 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-gray animate-pulse">
              일정을 불러오는 중...
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-gray/80 select-none">
            {day}일차 일정이 없습니다. {isEditing && "아래에서 추가해 보세요!"}
          </div>
        ) : (
          filteredItems.map((item) => (
            <PlaceItemCard
              key={item.id}
              id={item.id}
              time={item.time}
              place={item.place}
              isEditing={isEditing}
              onDelete={handleDeleteItem}
            />
          ))
        )}
      </div>

      {/* 일정편집 모드일 때만 하단 동선 입력창 노출 */}
      {isEditing && (
        <form
          onSubmit={handleAddItem}
          className="flex gap-2 shrink-0 border-t border-slate-100 pt-3 animate-in slide-in-from-bottom-2 duration-150 relative z-10"
        >
          <input
            type="text"
            placeholder="09:00"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            maxLength={5}
            className="w-16 h-10 px-2 text-center text-xs focus:outline-none input-custom"
          />
          <div className="flex-1 relative overflow-visible z-20">
            <input
              type="text"
              placeholder="장소 검색 (예: 서울시청)"
              value={newPlace}
              onChange={(e) => {
                setNewPlace(e.target.value);
                setSelectedSearchResult(null);
                handleSearchPlace(e.target.value);
              }}
              className="w-full h-10 px-3 text-xs focus:outline-none input-custom"
            />

            {/* ✅ 검색 결과 드롭다운 (위쪽 렌더링) */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-pure-white border border-slate-200 rounded-lg shadow-md z-50 max-h-48 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-xs font-medium text-dark transition-colors"
                  >
                    📍 {result.place_name}
                  </button>
                ))}
              </div>
            )}

            {/* ✅ 좌표 선택됨 표시 */}
            {selectedSearchResult && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary">
                ✓ 선택됨
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="h-10 px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-teal-700 shrink-0 transition-colors disabled:bg-gray disabled:cursor-not-allowed"
          >
            {isSearching ? "검색중..." : "장소추가"}
          </button>
        </form>
      )}
    </div>
  );
}
