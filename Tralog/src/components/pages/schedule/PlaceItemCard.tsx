// ===================================================
// PlaceItemCard.tsx - 타임라인 장소 카드
//
// 변경 사항:
//   - 비용 추가 시 카테고리 선택 추가 (가계부와 동일한 카테고리)
//   - 시간 수정 기능 (🕒 시간 버튼)
//   - 메모 삭제 기능
//   - localExpenses로 비용 즉시 UI 반영
// ===================================================

import { useState } from "react";

interface LocalExpense {
  detail: string;
  amount: number;
  category: string;
}

interface PlaceItemCardProps {
  id: string;
  time: string;
  place: string;
  index: number;
  isEditing: boolean;
  memo?: string;
  expenses?: LocalExpense[];
  onDelete: (id: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onAddExpense: (placeId: string, detail: string, amount: number, category: string) => void;
  onUpdateTime?: (id: string, newTime: string) => void;
}

// 가계부와 동일한 카테고리
const EXPENSE_CATEGORIES = ["식비", "숙소", "교통", "기타"] as const;

export default function PlaceItemCard({
  id,
  time,
  place,
  index,
  isEditing,
  memo,
  expenses: initialExpenses = [],
  onDelete,
  onUpdateMemo,
  onAddExpense,
  onUpdateTime,
}: PlaceItemCardProps) {
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [showCostInput, setShowCostInput] = useState(false);
  const [showTimeInput, setShowTimeInput] = useState(false);

  const [memoInput, setMemoInput] = useState(memo || "");
  const [costAmount, setCostAmount] = useState("");
  const [costCategory, setCostCategory] = useState<string>("식비"); // 카테고리 상태 추가
  const [timeInput, setTimeInput] = useState(time);

  // 비용 목록 로컬 상태 (추가하면 즉시 카드에 반영)
  const [localExpenses, setLocalExpenses] = useState<LocalExpense[]>(
    initialExpenses.map((e) => ({ ...e, category: e.category || "기타" }))
  );
  const [displayTime, setDisplayTime] = useState(time);

  const handleSaveMemo = () => {
    onUpdateMemo(id, memoInput);
    setShowMemoInput(false);
  };

  const handleDeleteMemo = () => {
    onUpdateMemo(id, "");
  };

  const handleSaveExpense = () => {
    const amount = parseInt(costAmount);
    if (isNaN(amount) || amount <= 0) return alert("올바른 금액을 입력해 주세요.");

    // 로컬 상태에 추가 → 카드에 즉시 반영
    setLocalExpenses((prev) => [
      ...prev,
      { detail: place, amount, category: costCategory },
    ]);
    onAddExpense(id, place, amount, costCategory);

    setShowCostInput(false);
    setCostAmount("");
    // 카테고리는 유지 (연속 입력 편의)
  };

  const handleDeleteExpense = (idx: number) => {
    setLocalExpenses((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTime = () => {
    if (!timeInput.trim()) return;
    setDisplayTime(timeInput);
    if (onUpdateTime) onUpdateTime(id, timeInput);
    setShowTimeInput(false);
  };

  return (
    <div className="relative flex items-stretch gap-3 w-full group mb-1">
      {/* 타임라인 번호 */}
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold shrink-0 z-10 shadow-sm mt-3">
          {index}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {/* 카드 본체 */}
        <div className="box-white p-4 flex flex-col w-full">
          {/* 시간 */}
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <span className="text-[11px]">🕒</span>
            <span className="text-xs text-number-accent">{displayTime}</span>
          </div>

          {/* 장소명 */}
          <h3>
            {place}
          </h3>

          {/* 메모 + 비용 태그 영역 */}
          {(memo || localExpenses.length > 0) && (
            <div className="flex flex-col gap-1.5 mt-2.5">
              {/* 메모 태그 */}
              {memo && !showMemoInput && (
                <div className="flex justify-between items-center bg-slate-600 text-white rounded-full px-3 py-1.5 group/memo">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <span>📝</span>
                    <span className="text-body-caption text-white">{memo}</span>
                  </div>
                  {isEditing && (
                    <button
                      onClick={handleDeleteMemo}
                      className="text-white/60 hover:text-white text-[11px] font-bold px-1 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* 비용 태그 목록 (카테고리 + 금액) */}
              {localExpenses.map((exp, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center px-1 py-0.5 group/exp"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {exp.category}
                    </span>
                    <span>💵</span>
                    <span className="text-body-caption text-xs">{exp.amount.toLocaleString()}원</span>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteExpense(idx)}
                      className="text-slate-300 hover:text-red-500 text-[11px] font-bold px-1 transition-colors opacity-0 group-hover/exp:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 편집 모드 액션 바 */}
          {isEditing && (
            <>
              <div className="h-px bg-slate-100 my-2.5" />
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowMemoInput(!showMemoInput);
                      setShowCostInput(false);
                      setShowTimeInput(false);
                    }}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors font-bold"
                  >
                    📝 메모
                  </button>
                  <button
                    onClick={() => {
                      setShowCostInput(!showCostInput);
                      setShowMemoInput(false);
                      setShowTimeInput(false);
                    }}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors font-bold"
                  >
                    💵 비용
                  </button>
                  <button
                    onClick={() => {
                      setShowTimeInput(!showTimeInput);
                      setShowMemoInput(false);
                      setShowCostInput(false);
                    }}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors font-bold"
                  >
                    🕒 시간
                  </button>
                </div>
                <button
                  onClick={() => onDelete(id)}
                  className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 transition-colors font-bold"
                >
                  🗑 삭제
                </button>
              </div>
            </>
          )}
        </div>

        {/* 메모 입력 폼 */}
        {showMemoInput && isEditing && (
          <div className="flex gap-2 animate-in slide-in-from-top-1 fade-in ml-1">
            <input
              type="text"
              placeholder="메모 내용"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveMemo()}
              autoFocus
              className="flex-1 h-9 px-3 text-xs input-custom rounded-full focus:outline-none"
            />
            <button
              onClick={handleSaveMemo}
              className="btn-dark h-9 px-4 text-xs shrink-0 rounded-full"
            >
              저장
            </button>
          </div>
        )}

        {/* 비용 입력 폼 (카테고리 선택 추가) */}
        {showCostInput && isEditing && (
          <div className="flex gap-2 animate-in slide-in-from-top-1 fade-in ml-1">
            {/* 카테고리 선택 드롭다운 */}
            <select
              value={costCategory}
              onChange={(e) => setCostCategory(e.target.value)}
              className="w-20 h-9 px-2 text-xs font-bold input-custom focus:outline-none rounded-full shrink-0"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="금액 (원)"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveExpense()}
              min={0}
              autoFocus
              className="flex-1 h-9 px-3 text-xs font-mono input-custom rounded-full focus:outline-none"
            />
            <button
              onClick={handleSaveExpense}
              className="btn-primary h-9 px-4 text-xs shrink-0 rounded-full"
            >
              등록
            </button>
          </div>
        )}

        {/* 시간 수정 폼 */}
        {showTimeInput && isEditing && (
          <div className="flex gap-2 animate-in slide-in-from-top-1 fade-in ml-1">
            <input
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="flex-1 h-9 px-3 text-xs font-mono input-custom rounded-full focus:outline-none"
            />
            <button
              onClick={handleSaveTime}
              className="btn-dark h-9 px-4 text-xs shrink-0 rounded-full"
            >
              저장
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
