import { useState } from "react";

interface Companion {
  id: string;
  name: string;
}

// 1. 기존 any를 대체할 시스템 중앙 유저 레코드 타입 명시
interface UserRecord {
  id: string;
  password?: string;
  name?: string;
  birth?: string;
  email?: string;
}

interface CompanionSectionProps {
  userId: string;
}

export default function CompanionSection({ userId }: CompanionSectionProps) {
  const [searchId, setSearchId] = useState("");
  const [message, setMessage] = useState("");

  const [companions, setCompanions] = useState<Companion[]>(() => {
    const stored = localStorage.getItem(`tralog_companions_${userId}`);
    if (stored) return JSON.parse(stored);

    const defaultData = [{ id: "jaehyun7", name: "김재현" }];
    localStorage.setItem(`tralog_companions_${userId}`, JSON.stringify(defaultData));
    return defaultData;
  });

  const handleAddCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const targetId = searchId.trim();

    if (!targetId) return;

    if (targetId === userId) {
      setMessage("⚠️ 본인은 일행으로 추가할 수 없습니다.");
      return;
    }

    if (companions.some(c => c.id === targetId)) {
      setMessage("⚠️ 이미 추가되어 있는 일행입니다.");
      return;
    }

    // 2. any 대신 UserRecord[] 제네릭을 부여하여 타입 안전성 확보
    const existingUsers = JSON.parse(localStorage.getItem("tralog_users_list") || "[]") as UserRecord[];
    
    // 3. (user: UserRecord) 형태로 매칭 검증 진행 (any 에러 지점 해결)
    const foundUser = existingUsers.find((user: UserRecord) => user.id === targetId);

    if (foundUser) {
      const updated = [...companions, { id: foundUser.id, name: foundUser.name || foundUser.id }];
      setCompanions(updated);
      localStorage.setItem(`tralog_companions_${userId}`, JSON.stringify(updated));
      
      setSearchId("");
      setMessage("✅ 일행이 성공적으로 추가되었습니다.");
    } else {
      setMessage("❌ 시스템에 존재하지 않는 아이디입니다.");
    }
  };

  const handleRemoveCompanion = (id: string) => {
    const updated = companions.filter(c => c.id !== id);
    setCompanions(updated);
    localStorage.setItem(`tralog_companions_${userId}`, JSON.stringify(updated));
  };

  return (
    <div className="box-custom bg-pure-white border border-slate-100 p-6 h-full flex flex-col gap-4 overflow-hidden">
      <div className="select-none">
        <h2 className="text-base font-bold text-dark mb-1">여행 동반자 초대하기</h2>
        <p className="text-xs text-gray leading-relaxed font-medium">
          함께 여행할 멤버의 아이디를 입력하여 일정 관리 권한을 위임하세요.
        </p>
      </div>

      <form onSubmit={handleAddCompanion} className="flex flex-col gap-1 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="동반자의 ID를 입력하세요"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 h-11 px-4 text-xs focus:outline-none input-custom"
          />
          <button 
            type="submit" 
            className="h-11 px-4 bg-primary text-white text-xs font-bold rounded-xl shrink-0 hover:bg-teal-700 transition-colors"
          >
            일행 추가
          </button>
        </div>
        {message && (
          <p className={`text-[11px] font-bold px-1 mt-1 transition-all ${
            message.startsWith("✅") ? "text-primary" : "text-red-500"
          }`}>
            {message}
          </p>
        )}
      </form>

      <div className="flex-1 flex flex-col gap-2 mt-2 overflow-hidden">
        <p className="text-xs font-bold text-gray select-none">
          참여 중인 동행 멤버 ({companions.length}명)
        </p>
        
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {companions.map((comp) => (
            <div 
              key={comp.id} 
              className="flex justify-between items-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/60"
            >
              <div className="flex items-center gap-2 select-none">
                <span className="text-sm">👤</span>
                <span className="text-xs font-bold text-dark">{comp.name}</span>
                <span className="text-[10px] text-gray font-mono">({comp.id})</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold text-primary bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/30">
                  편집 가능
                </span>
                <button
                  onClick={() => handleRemoveCompanion(comp.id)}
                  className="w-4 h-4 rounded-full text-slate-400 hover:text-red-500 font-bold text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                  title="멤버 제외"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}