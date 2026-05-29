// src/components/pages/schedule/AccountBookSection.tsx
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../config/api";

interface AccountItem {
  id: string;
  category: string;
  detail: string;
  amount: number;
}

// ✅ 백엔드에서 받아오는 데이터의 타입을 명시적으로 지정
interface ApiExpenseData {
  id: string;
  category: string;
  detail: string;
  amount: number;
}

interface AccountBookSectionProps {
  scheduleId: string;
}

const CATEGORIES = ["식비", "숙소", "교통", "기타"] as const;

export default function AccountBookSection({
  scheduleId,
}: AccountBookSectionProps) {
  const [expenses, setExpenses] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("식비");

  useEffect(() => {
    let isMounted = true;
    const fetchExpenses = async () => {
      if (!scheduleId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) return;
        const data = await res.json();

        // ✅ any 대신 ApiExpenseData 타입 지정
        const mapped = (data.expenses || []).map((e: ApiExpenseData) => ({
          id: e.id,
          category: e.category,
          detail: e.detail,
          amount: e.amount,
        }));

        if (isMounted) setExpenses(mapped);
      } catch (err) {
        console.error("가계부 로딩 오류:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchExpenses();
    return () => {
      isMounted = false;
    };
  }, [scheduleId]);

  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim() || !amount.trim()) return;

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0)
      return alert("올바른 금액을 입력해주세요.");

    const newId = `acc-${Date.now()}`;
    const newExpense = {
      id: newId,
      category,
      detail: detail.trim(),
      amount: parsedAmount,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newExpense, schedule_id: scheduleId }),
      });
      if (res.ok) {
        setExpenses((prev) => [...prev, newExpense]);
        setDetail("");
        setAmount("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setExpenses((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-5 overflow-hidden bg-white">
      <div className="flex justify-between items-end pb-3 border-b-2 border-slate-800 shrink-0 select-none">
        <h2 className="text-xl font-black text-slate-800 m-0">여행 가계부</h2>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          총 지출액: {totalAmount.toLocaleString()}원
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-0 scrollbar">
        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-400">
            내역을 불러오는 중입니다...
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            기록된 지출 내역이 없습니다.
          </div>
        ) : (
          expenses.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center py-3.5 border-b border-slate-100 group"
            >
              <div className="flex gap-4 items-center">
                <span className="text-[10px] font-bold text-slate-400 w-8">
                  {item.category}
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {item.detail}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold text-slate-800">
                  {item.amount.toLocaleString()} 원
                </span>
                <button
                  onClick={() => handleDeleteExpense(item.id)}
                  className="text-[10px] font-bold text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleAddExpense}
        className="shrink-0 flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200"
      >
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-20 h-10 px-2 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="지출 내역"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="flex-1 h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
        />
        <input
          type="number"
          placeholder="금액 (원)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          className="w-24 h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
        />
        <button
          type="submit"
          className="h-10 px-4 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-800 shrink-0"
        >
          기록
        </button>
      </form>
    </div>
  );
}
