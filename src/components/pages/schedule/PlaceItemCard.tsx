// src/components/pages/schedule/PlaceItemCard.tsx
import { useState } from "react";

interface PlaceItemCardProps {
  id: string;
  time: string;
  place: string;
  index: number;
  isEditing: boolean;
  memo?: string;
  onDelete: (id: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onAddExpense: (detail: string, amount: number) => void;
}

export default function PlaceItemCard({
  id,
  time,
  place,
  index,
  isEditing,
  memo,
  onDelete,
  onUpdateMemo,
  onAddExpense,
}: PlaceItemCardProps) {
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [memoInput, setMemoInput] = useState(memo || "");

  const [showCostInput, setShowCostInput] = useState(false);
  const [costAmount, setCostAmount] = useState("");

  const handleSaveMemo = () => {
    onUpdateMemo(id, memoInput);
    setShowMemoInput(false);
  };

  const handleSaveExpense = () => {
    const amount = parseInt(costAmount);
    if (isNaN(amount) || amount <= 0)
      return alert("올바른 금액을 입력해 주세요.");
    onAddExpense(place, amount); // 장소 이름을 내역(detail)으로 사용
    setShowCostInput(false);
    setCostAmount("");
  };

  return (
    <div className="relative flex items-start gap-4 w-full group">
      {/* 타임라인 원형 인디케이터 (Figma 테마색 적용) */}
      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0 relative z-10 border-2 border-white mt-1 shadow-sm">
        {index}
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {/* 장소 카드 본문 */}
        <div className="bg-white border border-slate-200 rounded-4xl p-4 shadow-sm hover:border-slate-300 transition-colors w-full">
          <div className="flex items-center gap-2 mb-1.5 opacity-80">
            <span className="text-[11px] font-bold text-gray font-mono tracking-tighter">
              🕒 {time}
            </span>
          </div>

          <h3 className="text-sm font-black text-dark m-0 mb-3 tracking-tight">
            {place}
          </h3>

          {/* 등록된 메모 영역 (Figma 스타일의 내부 진한 박스) */}
          {memo && !showMemoInput && (
            <div className="bg-slate-700 text-slate-100 rounded-4xl p-3 text-xs font-medium leading-relaxed relative flex justify-between items-center group/memo">
              <div className="flex items-center gap-2">
                <span>📝</span>
                <span className="opacity-90">{memo}</span>
              </div>
              {isEditing && (
                <button
                  onClick={() => setShowMemoInput(true)}
                  className="text-[10px] font-bold opacity-0 group-hover/memo:opacity-100 hover:text-white transition-all text-slate-400"
                >
                  수정
                </button>
              )}
            </div>
          )}

          {/* 하단 액션 버튼 그룹 */}
          {isEditing && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowMemoInput(!showMemoInput);
                  setShowCostInput(false);
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                📝 메모 추가
              </button>
              <button
                onClick={() => {
                  setShowCostInput(!showCostInput);
                  setShowMemoInput(false);
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                💵 비용 추가
              </button>
              <div className="flex-1" />
              <button
                onClick={() => onDelete(id)}
                className="text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                🗑️ 삭제
              </button>
            </div>
          )}
        </div>

        {/* 인라인 메모 입력 폼 */}
        {showMemoInput && isEditing && (
          <div className="flex gap-2 animate-in slide-in-from-top-1 fade-in duration-200 ml-2">
            <input
              type="text"
              placeholder="이 장소에 대한 메모를 남겨보세요"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              autoFocus
              className="flex-1 h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 shadow-sm"
            />
            <button
              onClick={handleSaveMemo}
              className="h-9 px-3 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-800 shrink-0 shadow-sm"
            >
              저장
            </button>
          </div>
        )}

        {/* 인라인 가계부 비용 입력 폼 */}
        {showCostInput && isEditing && (
          <div className="flex gap-2 animate-in slide-in-from-top-1 fade-in duration-200 ml-2">
            <input
              type="number"
              placeholder="비용 입력 (원)"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              min={0}
              autoFocus
              className="w-32 h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono shadow-sm"
            />
            <button
              onClick={handleSaveExpense}
              className="h-9 px-3 bg-primary text-white text-xs font-bold rounded-lg hover:bg-teal-700 shrink-0 shadow-sm"
            >
              가계부 등록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
