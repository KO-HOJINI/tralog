// ===================================================
// AccountBookSection.tsx - 여행 가계부 섹션
//
// 백엔드 API:
//   GET    /api/schedules/:id    → expenses 포함한 전체 일정 데이터
//   POST   /api/expenses         → 지출 내역 추가
//   DELETE /api/expenses/:id     → 지출 내역 삭제
//
// 가계부 일차별 그룹핑 버그 수정:
//   문제: DB에서 day_number가 null로 오는 경우 모두 "여행 준비"로 묶임
//   → day_number 없는 항목도 "미지정"으로 별도 표시
//   → 그룹 순서 정렬: 숫자 일차 → 미지정 순
//
// AI 도움: reduce 패턴 + 정렬 로직
// ===================================================

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../config/api";

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

const CATEGORIES = ["식비", "숙소", "교통", "기타"] as const;

export default function AccountBookSection({
  scheduleId,
  companionCount = 1,
}: AccountBookSectionProps) {
  const [expenses, setExpenses] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("식비");

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

  // 일차별 그룹핑 (AI 도움: reduce + 정렬)
  // day_number가 숫자인 항목 → "N일차"
  // day_number가 없는 항목 → "미지정"
  const groupedByDay = expenses.reduce<Record<string, AccountItem[]>>((acc, item) => {
    const key =
      item.day_number !== undefined && item.day_number !== null
        ? `${item.day_number}일차`
        : "미지정";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // 그룹 키 정렬: 1일차, 2일차 ... 숫자 순 → 마지막에 "미지정"
  const groupKeys = Object.keys(groupedByDay).sort((a, b) => {
    if (a === "미지정") return 1;
    if (b === "미지정") return -1;
    return parseInt(a) - parseInt(b);
  });

  // 지출 추가
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim() || !amount.trim()) return;

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) return alert("올바른 금액을 입력해주세요.");

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
        body: JSON.stringify({ ...newExpense, schedule_id: scheduleId }),
      });
      if (res.ok) {
        setExpenses((prev) => [...prev, newExpense]);
        setDetail("");
        setAmount("");
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
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          여행 인원 {companionCount}명
        </span>
      </div>

      {/* 지출 리스트 (일차별 그룹) */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0 scrollbar">
        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-400 animate-pulse">
            내역을 불러오는 중...
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            기록된 지출 내역이 없습니다.
          </div>
        ) : (
          groupKeys.map((groupKey) => (
            <div key={groupKey}>
              {/* 일차 구분 헤더 */}
              <div className="flex items-center gap-2 py-2 mt-3 first:mt-0">
                <span className="text-[11px] font-bold text-slate-500">{groupKey}</span>
                <div className="flex-1 h-px bg-slate-100" />
                {/* 해당 일차 소계 */}
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  {groupedByDay[groupKey]
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString()}원
                </span>
              </div>

              {/* 해당 일차 항목 */}
              {groupedByDay[groupKey].map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-3 border-b border-slate-50 group hover:bg-slate-50/50 transition-colors px-1 rounded-lg"
                >
                  <div className="flex gap-3 items-center">
                    <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">
                      {item.category}
                    </span>
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
      <form
        onSubmit={handleAddExpense}
        className="shrink-0 flex gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200"
      >
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-20 h-10 px-2 text-xs font-bold input-custom focus:outline-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="지출 내역"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="flex-1 h-10 px-3 text-xs input-custom focus:outline-none"
        />
        <input
          type="number"
          placeholder="금액 (원)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          className="w-24 h-10 px-3 text-xs input-custom focus:outline-none font-mono"
        />
        <button type="submit" className="btn-primary h-10 px-4 text-xs shrink-0">
          기록
        </button>
      </form>
    </div>
  );
}
