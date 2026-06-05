// AccountBookSection.tsx - 여행 가계부 섹션
// 일정에 기록된 지출 내역을 일차별로 그룹화해서 보여줍니다.
// 하단 입력 폼에서 새 지출을 추가하고, 항목 위에 마우스를 올리면 삭제 버튼이 나타납니다.

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../../config/api";
import ExpenseAddForm from "./ExpenseAddForm";

interface AccountItem {
  id: string;
  category: string;
  detail: string;
  amount: number;
  day_number?: number;
}

interface ApiExpenseData {
  id: string;
  category: string;
  detail: string;
  amount: number;
  day_number?: number;
}

interface AccountBookSectionProps {
  scheduleId: string;
  companionCount?: number;
}

export default function AccountBookSection({
  scheduleId,
  companionCount = 1,
}: AccountBookSectionProps) {
  const [expenses, setExpenses] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 지출 내역 불러오기
  useEffect(() => {
    let isMounted = true;
    const fetchExpenses = async () => {
      if (!scheduleId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`);
        if (!res.ok) return;
        const data = await res.json();

        const mapped: AccountItem[] = (data.expenses || []).map((e: ApiExpenseData) => ({
          id: e.id,
          category: e.category,
          detail: e.detail,
          amount: e.amount,
          day_number: e.day_number ?? undefined,
        }));

        if (isMounted) setExpenses(mapped);
      } catch (err) {
        console.error("가계부 로딩 오류:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchExpenses();
    return () => { isMounted = false; };
  }, [scheduleId]);

  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  // 일차별 그룹
  const groupedByDay = expenses.reduce<Record<string, AccountItem[]>>((acc, item) => {
    const key =
      item.day_number !== undefined && item.day_number !== null
        ? `${item.day_number}일차`
        : "미지정";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const groupKeys = Object.keys(groupedByDay).sort((a, b) => {
    if (a === "미지정") return 1;
    if (b === "미지정") return -1;
    return parseInt(a) - parseInt(b);
  });

  // 지출 추가 API 호출 전담 함수
  const handleAddExpense = async (category: string, detail: string, amount: number) => {
    const newId = `acc-${Date.now()}`;
    const newExpense: AccountItem = {
      id: newId,
      category,
      detail,
      amount,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newExpense, schedule_id: scheduleId }),
      });
      if (res.ok) {
        setExpenses((prev) => [...prev, newExpense]);
      }
    } catch (err) {
      console.error("지출 추가 오류:", err);
    }
  };

  // 지출 삭제
  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) setExpenses((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("지출 삭제 오류:", err);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-4 overflow-hidden bg-white">
      {/* 헤더 */}
      <div className="flex justify-between items-end pb-3 border-b-2 border-slate-800 shrink-0 select-none">
        <h2 className="text-xl font-black text-slate-800 m-0">여행 가계부</h2>
        <span className="badge badge-sm bg-slate-100 text-slate-500 border-0">
          여행 인원 {companionCount}명
        </span>
      </div>

      {/* 지출 리스트 (일차별 그룹) */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0 scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            기록된 지출 내역이 없습니다.
          </div>
        ) : (
          groupKeys.map((groupKey) => (
            <div key={groupKey}>
              <div className="flex items-center gap-2 py-2 mt-3 first:mt-0">
                <span className="text-[11px] font-bold text-slate-500">{groupKey}</span>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  {groupedByDay[groupKey].reduce((sum, item) => sum + item.amount, 0).toLocaleString()}원
                </span>
              </div>

              {groupedByDay[groupKey].map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-3 border-b border-slate-50 group hover:bg-slate-50/50 transition-colors px-1 rounded-lg"
                >
                  <div className="flex gap-3 items-center">
                    <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">{item.category}</span>
                    <span className="text-sm font-bold text-slate-700">{item.detail}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
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
              ))}
            </div>
          ))
        )}
      </div>

      {/* 총 비용 합계 */}
      {!isLoading && expenses.length > 0 && (
        <div className="flex justify-between items-center pt-3 border-t-2 border-slate-800 shrink-0 select-none">
          <span className="text-xs font-bold text-slate-500">총 비용</span>
          <span className="text-base font-black text-dark font-mono">
            {totalAmount.toLocaleString()} 원
          </span>
        </div>
      )}

      {/* 지출 추가 폼 */}
      <ExpenseAddForm onAddExpense={handleAddExpense} />
    </div>
  );
}