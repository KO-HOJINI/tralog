// src/components/pages/schedule/AccountBookSection.tsx
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../../config/api";

interface AccountItem {
  id: string;
  category: string;
  detail: string;
  amount: number;
}

interface AccountBookSectionProps {
  userId: string;
  scheduleId: string; // ✅ 추가: 일정 ID 기반으로 DB 연동
}

const CATEGORIES = ["식비", "숙소", "교통", "기타"] as const;

// 카테고리별 이모지 매핑
const CATEGORY_EMOJI: Record<string, string> = {
  식비: "🍽️",
  숙소: "🏨",
  교통: "🚌",
  기타: "📌",
};

export default function AccountBookSection({
  scheduleId,
}: AccountBookSectionProps) {
  const [expenses, setExpenses] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("식비");

  // ✅ DB에서 지출 내역 fetch
  const fetchExpenses = useCallback(async () => {
    if (!scheduleId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
      if (!res.ok) throw new Error("가계부 로드 실패");
      const data = await res.json();

      const mapped: AccountItem[] = (data.expenses || []).map(
        (e: {
          id: string;
          category: string;
          detail: string;
          amount: number;
        }) => ({
          id: e.id,
          category: e.category,
          detail: e.detail,
          amount: e.amount,
        }),
      );
      setExpenses(mapped);
    } catch (err) {
      console.error("가계부 fetch 오류:", err);
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // 지출 총액 실시간 계산
  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  // 카테고리별 소계
  const categoryTotals = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = expenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
      return acc;
    },
    {} as Record<string, number>,
  );

  // ✅ 지출 추가: DB에 저장
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim() || !amount.trim()) return;

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      alert("올바른 금액을 입력해 주세요.");
      return;
    }

    const newId = `acc-${Date.now()}`;
    const newExpense: AccountItem = {
      id: newId,
      category,
      detail: detail.trim(),
      amount: parsedAmount,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId,
          schedule_id: scheduleId,
          category,
          detail: detail.trim(),
          amount: parsedAmount,
        }),
      });

      if (res.ok) {
        setExpenses((prev) => [...prev, newExpense]);
        setDetail("");
        setAmount("");
      } else {
        alert("지출 등록에 실패했습니다.");
      }
    } catch (err) {
      console.error("지출 추가 오류:", err);
      alert("서버 연결 오류가 발생했습니다.");
    }
  };

  // ✅ 지출 삭제: DB에서 삭제
  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setExpenses((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("지출 삭제 오류:", err);
    }
  };

  return (
    <div className="box-custom bg-pure-white shadow-card border border-slate-100 p-6 h-full flex flex-col gap-4 overflow-hidden">
      {/* 상단 총 정산 카드 */}
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200/40 p-4 rounded-2xl shrink-0 select-none">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-gray">현재 총 지출액</span>
          {/* ✅ 카테고리별 소계 요약 표시 */}
          <div className="flex gap-2 mt-1 flex-wrap">
            {CATEGORIES.filter((cat) => categoryTotals[cat] > 0).map((cat) => (
              <span
                key={cat}
                className="text-[10px] font-bold text-gray bg-slate-100 px-1.5 py-0.5 rounded-md"
              >
                {CATEGORY_EMOJI[cat]} {cat}{" "}
                {categoryTotals[cat].toLocaleString()}원
              </span>
            ))}
          </div>
        </div>
        <h2 className="text-xl font-black text-secondary m-0 tracking-tight">
          {totalAmount.toLocaleString()} 원
        </h2>
      </div>

      {/* 가계부 내역 스크롤 리스트 */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-xs text-gray animate-pulse">
              내역을 불러오는 중...
            </span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray/80 py-12 select-none border border-dashed border-slate-100 rounded-2xl">
            기록된 지출 내역이 없습니다. 아래 폼에서 추가해 보세요!
          </div>
        ) : (
          expenses.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/70 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200/70 text-gray select-none shrink-0">
                  {CATEGORY_EMOJI[item.category]} {item.category}
                </span>
                <span className="text-xs font-bold text-dark truncate max-w-45">
                  {item.detail}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs font-black text-dark font-mono">
                  {item.amount.toLocaleString()}원
                </span>
                <button
                  onClick={() => handleDeleteExpense(item.id)}
                  className="w-4 h-4 rounded-full text-gray hover:text-red-500 font-bold text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 하단 입력 폼 */}
      <form
        onSubmit={handleAddExpense}
        className="flex flex-col gap-2 shrink-0 border-t border-slate-100 pt-3"
      >
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-20 h-10 px-2 text-xs focus:outline-none input-custom bg-pure-white font-bold text-dark text-center"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="예: 갈치조림 점심 식사"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="flex-1 h-10 px-3 text-xs focus:outline-none input-custom"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="금액을 입력하세요 (원)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={0}
            className="flex-1 h-10 px-3 text-xs focus:outline-none input-custom font-mono"
          />
          <button
            type="submit"
            className="h-10 px-5 bg-secondary text-white text-xs font-bold rounded-xl shrink-0 hover:opacity-95 transition-opacity"
          >
            지출 기록
          </button>
        </div>
      </form>
    </div>
  );
}
