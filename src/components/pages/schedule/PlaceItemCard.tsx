// ===================================================
// PlaceItemCard.tsx - 타임라인 장소 카드 컴포넌트
//
// 피그마 디자인 반영:
//   - 카드 헤더: teal(primary) 배경에 번호 + 장소명 + 시간
//   - 비용 태그: amber(secondary) 배경 인라인 태그로 카드에 표시
//   - 메모: 다크 박스로 내부 표시
//
// 🐛 버그 수정: 비용 추가 후 카드에 안 뜨던 문제
//   → PlaceItemCard 내부에 localExpenses 상태 추가
//   → onAddExpense 호출 시 로컬 상태에도 반영
// ===================================================

import { useState } from "react";

interface LocalExpense {
  detail: string;
  amount: number;
}

interface PlaceItemCardProps {
  id: string;
  time: string;
  place: string;
  index: number;
  isEditing: boolean;
  memo?: string;
  expenses?: LocalExpense[]; // 부모에서 초기값 내려받음 (선택)
  onDelete: (id: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onAddExpense: (placeId: string, detail: string, amount: number) => void;
}

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
}: PlaceItemCardProps) {
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [memoInput, setMemoInput] = useState(memo || "");

  const [showCostInput, setShowCostInput] = useState(false);
  const [costAmount, setCostAmount] = useState("");
  const [costDetail, setCostDetail] = useState(place); // 내역 기본값 = 장소명

  // 🐛 Fix: 비용 목록을 카드 내부 상태로 관리 → 추가하면 바로 UI 반영
  const [localExpenses, setLocalExpenses] = useState<LocalExpense[]>(initialExpenses);

  const handleSaveMemo = () => {
    onUpdateMemo(id, memoInput);
    setShowMemoInput(false);
  };

  const handleSaveExpense = () => {
    const amount = parseInt(costAmount);
    if (isNaN(amount) || amount <= 0) return alert("올바른 금액을 입력해 주세요.");

    // 로컬 상태에 추가 → 카드에 즉시 반영
    setLocalExpenses((prev) => [...prev, { detail: costDetail || place, amount }]);
    onAddExpense(id, costDetail || place, amount);

    setShowCostInput(false);
    setCostAmount("");
    setCostDetail(place);
  };

  const handleDeleteExpense = (idx: number) => {
    setLocalExpenses((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="relative flex items-start gap-3 w-full group">
      {/* 타임라인 번호 인디케이터 */}
      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0 relative z-10 border-2 border-white mt-1 shadow-sm">
        {index}
      </div>

      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* 장소 카드 */}
        <div className="box-white border border-slate-100 hover:border-slate-200 transition-all w-full overflow-hidden">

          {/* 카드 헤더: teal 배경 (피그마 디자인) */}
          <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-white/80 font-mono tracking-tight">
                🕒 {time}
              </span>
            </div>
            {isEditing && (
              <button
                onClick={() => onDelete(id)}
                className="text-white/60 hover:text-white transition-colors text-[10px] font-bold"
              >
                ✕ 삭제
              </button>
            )}
          </div>

          {/* 카드 본문 */}
          <div className="p-4">
            <h3 className="text-sm font-black text-dark m-0 mb-2 tracking-tight">
              {place}
            </h3>

            {/* 비용 태그 목록 (피그마: amber 배경 인라인 태그) */}
            {localExpenses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {localExpenses.map((exp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-secondary/15 border border-secondary/30 text-secondary rounded-full px-2.5 py-0.5 text-[11px] font-bold group/exp"
                  >
                    <span>💳</span>
                    <span>{exp.detail}</span>
                    <span className="font-mono">{exp.amount.toLocaleString()}원</span>
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteExpense(idx)}
                        className="text-secondary/50 hover:text-red-500 ml-0.5 opacity-0 group-hover/exp:opacity-100 transition-opacity text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 메모 박스 (다크 배경) */}
            {memo && !showMemoInput && (
              <div className="bg-slate-700 text-slate-100 rounded-2xl p-3 text-xs font-medium leading-relaxed flex justify-between items-start gap-2 mt-2">
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0">📝</span>
                  <span className="opacity-90">{memo}</span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => setShowMemoInput(true)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors shrink-0"
                  >
                    수정
                  </button>
                )}
              </div>
            )}

            {/* 편집 모드 액션 버튼 */}
            {isEditing && (
              <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => { setShowMemoInput(!showMemoInput); setShowCostInput(false); }}
                  className="text-[11px] font-bold text-slate-500 hover:text-dark transition-colors"
                >
                  📝 메모
                </button>
                <button
                  onClick={() => { setShowCostInput(!showCostInput); setShowMemoInput(false); }}
                  className="text-[11px] font-bold text-slate-500 hover:text-dark transition-colors"
                >
                  💳 비용
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 메모 입력 폼 */}
        {showMemoInput && isEditing && (
          <div className="flex gap-2 animate-in slide-in-from-top-1 fade-in duration-200 ml-1">
            <input
              type="text"
              placeholder="이 장소에 대한 메모를 남겨보세요"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveMemo()}
              autoFocus
              className="flex-1 h-9 px-3 text-xs input-custom focus:outline-none"
            />
            <button
              onClick={handleSaveMemo}
              className="btn-dark h-9 px-3 text-xs shrink-0"
            >
              저장
            </button>
          </div>
        )}

        {/* 비용 입력 폼 */}
        {showCostInput && isEditing && (
          <div className="flex gap-2 animate-in slide-in-from-top-1 fade-in duration-200 ml-1">
            <input
              type="text"
              placeholder="내역 (기본: 장소명)"
              value={costDetail}
              onChange={(e) => setCostDetail(e.target.value)}
              className="flex-1 h-9 px-3 text-xs input-custom focus:outline-none"
            />
            <input
              type="number"
              placeholder="금액 (원)"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveExpense()}
              min={0}
              autoFocus
              className="w-28 h-9 px-3 text-xs input-custom focus:outline-none font-mono"
            />
            <button
              onClick={handleSaveExpense}
              className="btn-primary h-9 px-3 text-xs shrink-0"
            >
              등록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
