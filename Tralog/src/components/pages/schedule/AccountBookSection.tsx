// ===================================================
// AccountBookSection.tsx - 여행 가계부 섹션
//
// 백엔드 API:
//   GET    /api/schedules/:id    → expenses 포함한 전체 일정 데이터
//   POST   /api/expenses         → 지출 내역 추가
//   DELETE /api/expenses/:id     → 지출 내역 삭제
//
// 피그마 디자인 반영:
//   - 일차별 그룹핑 + 날짜 구분선
//   - 총 비용 하단 표시
//   - category 없이 깔끔한 리스트 형태
//
// AI 도움: reduce로 일차별 그룹핑 처리
// ===================================================

import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../config/api";

interface AccountItem {
  id: string;
  category: string;
  detail: string;
  amount: number;
  day_number?: number; // 일차 정보 (그룹핑용)
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
  companionCount?: number; // 일행 수 (피그마에서 우측 상단에 표시)
}

const CATEGORIES = ["식비", "숙소", "교통", "기타"] as const;

export default function AccountBookSection({
  scheduleId,
  companionCount = 1,
}: AccountBookSectionProps) {
  const [expenses, setExpenses] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 입력 폼 상태
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
          day_number: e.day_number,
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

  // 일차별 그룹핑 (AI 도움: reduce 패턴)
  // day_number 없는 항목은 "여행 준비"로 분류
  const groupedByDay = expenses.reduce<Record<string, AccountItem[]>>((acc, item) => {
    const key = item.day_number ? `${item.day_number}일차` : "여행 준비";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const groupKeys = Object.keys(groupedByDay);

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
              <div className="text-[11px] font-bold text-slate-500 py-2 mt-2 first:mt-0 border-b border-slate-100">
                {groupKey}
              </div>

              {/* 해당 일차 지출 목록 */}
              {groupedByDay[groupKey].map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-3.5 border-b border-slate-50 group hover:bg-slate-50/50 transition-colors px-1 rounded-lg"
                >
                  <div className="flex gap-3 items-center">
                    <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">
                      {item.category}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {item.detail}
                    </span>
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

      {/* 총 비용 (피그마: 하단 구분선 + 합계) */}
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
        <button type="submit" className="btn-dark h-10 px-4 text-xs shrink-0">
          기록
        </button>
      </form>
    </div>
  );
}
