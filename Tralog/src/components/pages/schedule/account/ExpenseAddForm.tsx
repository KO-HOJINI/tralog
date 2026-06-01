import { useState } from "react";

interface ExpenseAddFormProps {
  onAddExpense: (category: string, detail: string, amount: number) => Promise<void>;
}

const CATEGORIES = ["식비", "숙소", "교통", "기타"] as const;

export default function ExpenseAddForm({ onAddExpense }: ExpenseAddFormProps) {
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("식비");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail.trim() || !amount.trim()) return;

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return alert("올바른 금액을 입력해주세요.");
    }

    // 부모 컴포넌트가 넘겨준 추가 함수 실행
    await onAddExpense(category, detail.trim(), parsedAmount);
    
    // 입력 칸 초기화
    setDetail("");
    setAmount("");
  };

  return (
    <form
      onSubmit={handleSubmit}
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
  );
}