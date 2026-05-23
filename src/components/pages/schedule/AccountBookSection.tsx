import { useState } from "react";

interface AccountItem {
  id: string;
  category: string;
  detail: string;
  amount: number;
}

interface AccountBookSectionProps {
  userId: string;
}

export default function AccountBookSection({ userId }: AccountBookSectionProps) {
  // 지연 초기화 함수로 로컬 스토리지에서 안전하게 동기화 (useEffect 에러 예방)
  const [expenses, setExpenses] = useState<AccountItem[]>(() => {
    const stored = localStorage.getItem(`tralog_account_${userId}`);
    if (stored) return JSON.parse(stored);
    
    // 기본 목업 데이터 세팅
    const defaultData = [
      { id: "acc-1", category: "숙소", detail: "신라호텔 연박 결제", amount: 450000 },
      { id: "acc-2", category: "식비", detail: "협재 갈치조림 오찬", amount: 75000 }
    ];
    localStorage.setItem(`tralog_account_${userId}`, JSON.stringify(defaultData));
    return defaultData;
  });

  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("식비");

  // 지출 총액 합산 실시간 메모라이징 효과
  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim() || !amount.trim()) return;

    const newExpense: AccountItem = {
      id: `acc-${Date.now()}`,
      category,
      detail: detail.trim(),
      amount: parseInt(amount) || 0
    };

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    localStorage.setItem(`tralog_account_${userId}`, JSON.stringify(updated));

    setDetail("");
    setAmount("");
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(item => item.id !== id);
    setExpenses(updated);
    localStorage.setItem(`tralog_account_${userId}`, JSON.stringify(updated));
  };

  return (
    <div className="box-custom bg-pure-white border border-slate-100 p-6 h-full flex flex-col gap-4 overflow-hidden">
      {/* 상단 총 정산 카드 보드 */}
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200/40 p-4 rounded-2xl shrink-0 select-none">
        <span className="text-xs font-bold text-gray">현재 총 지출액</span>
        <h2 className="text-xl font-black text-secondary m-0 tracking-tight">
          {totalAmount.toLocaleString()} 원
        </h2>
      </div>

      {/* 가계부 내역 스크롤 리스트 */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
        {expenses.length === 0 ? (
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
                  {item.category}
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

      {/* 가계부 하단 입력 폼 모듈 */}
      <form onSubmit={handleAddExpense} className="flex flex-col gap-2 shrink-0 border-t border-slate-100 pt-3">
        <div className="flex gap-2">
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-20 h-10 px-2 text-xs focus:outline-none input-custom bg-pure-white font-bold text-dark text-center"
          >
            <option value="식비">식비</option>
            <option value="숙소">숙소</option>
            <option value="교통">교통</option>
            <option value="기타">기타</option>
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
            className="flex-1 h-10 px-3 text-xs focus:outline-none input-custom font-mono"
          />
          <button type="submit" className="h-10 px-5 bg-secondary text-white text-xs font-bold rounded-xl shrink-0 hover:opacity-95 transition-opacity">
            지출 기록
          </button>
        </div>
      </form>
    </div>
  );
}