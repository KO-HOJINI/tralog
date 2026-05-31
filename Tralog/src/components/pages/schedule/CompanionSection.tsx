// ===================================================
// CompanionSection.tsx - 여행 동반자 관리 섹션
//
// 현재 localStorage 기반으로 동작함 (백엔드 미연동)
// 피그마 디자인 반영:
//   - 우측에 일정 제목 + 기간 표시
//   - 인풋 + 추가 버튼 심플 구성
//   - 멤버 목록: 이름 + 아이디 + 편집가능 뱃지
//
// TODO: 나중에 백엔드 API로 교체 예정
// ===================================================

import { useState } from "react";

interface Companion {
  id: string;
  name: string;
}

interface UserRecord {
  id: string;
  password?: string;
  name?: string;
  birth?: string;
  email?: string;
}

interface CompanionSectionProps {
  userId: string;
  scheduleTitle?: string;
  schedulePeriod?: string;
}

export default function CompanionSection({
  userId,
  scheduleTitle,
  schedulePeriod,
}: CompanionSectionProps) {
  const [searchId, setSearchId] = useState("");
  const [message, setMessage] = useState("");

  // localStorage에서 초기 동반자 목록 불러옴
  const [companions, setCompanions] = useState<Companion[]>(() => {
    const stored = localStorage.getItem(`tralog_companions_${userId}`);
    if (stored) return JSON.parse(stored);
    const defaultData = [{ id: "jaehyun7", name: "김재현" }];
    localStorage.setItem(`tralog_companions_${userId}`, JSON.stringify(defaultData));
    return defaultData;
  });

  // 동반자 추가
  const handleAddCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const targetId = searchId.trim();
    if (!targetId) return;

    if (targetId === userId) {
      setMessage("⚠️ 본인은 일행으로 추가할 수 없습니다.");
      return;
    }

    if (companions.some((c) => c.id === targetId)) {
      setMessage("⚠️ 이미 추가된 일행입니다.");
      return;
    }

    const existingUsers = JSON.parse(
      localStorage.getItem("tralog_users_list") || "[]",
    ) as UserRecord[];

    const foundUser = existingUsers.find((user: UserRecord) => user.id === targetId);

    if (foundUser) {
      const updated = [...companions, { id: foundUser.id, name: foundUser.name || foundUser.id }];
      setCompanions(updated);
      localStorage.setItem(`tralog_companions_${userId}`, JSON.stringify(updated));
      setSearchId("");
      setMessage("✅ 일행이 추가되었습니다.");
    } else {
      setMessage("❌ 존재하지 않는 아이디입니다.");
    }
  };

  // 동반자 제거
  const handleRemoveCompanion = (id: string) => {
    const updated = companions.filter((c) => c.id !== id);
    setCompanions(updated);
    localStorage.setItem(`tralog_companions_${userId}`, JSON.stringify(updated));
  };

  return (
    <div className="p-6 h-full flex flex-col gap-5 overflow-hidden bg-white">

      {/* 헤더: 일정 제목 + 기간 (피그마 우측 패널 상단) */}
      {scheduleTitle && (
        <div className="pb-4 border-b border-slate-100 shrink-0 select-none">
          <h2 className="font-black text-dark m-0 mb-1">{scheduleTitle}</h2>
          {schedulePeriod && (
            <span className="text-xs font-bold text-slate-500">{schedulePeriod}</span>
          )}
        </div>
      )}

      {/* 동반자 추가 인풋 */}
      <div className="shrink-0">
        <p className="text-xs font-bold text-dark mb-2 select-none">일행의 ID를 입력하세요</p>
        <form onSubmit={handleAddCompanion} className="flex gap-2">
          <input
            type="text"
            placeholder="아이디를 입력하세요"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 h-11 px-4 text-xs focus:outline-none input-custom"
          />
          <button type="submit" className="btn-primary h-11 px-5 text-xs shrink-0">
            추가
          </button>
        </form>
        {message && (
          <p className={`text-[11px] font-bold px-1 mt-1.5 ${
            message.startsWith("✅") ? "text-primary" : "text-red-500"
          }`}>
            {message}
          </p>
        )}
      </div>

      {/* 멤버 목록 */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        <p className="text-xs font-bold text-gray select-none shrink-0">
          참여 중인 멤버 ({companions.length}명)
        </p>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar">
          {companions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              아직 초대된 일행이 없습니다.
            </div>
          ) : (
            companions.map((comp) => (
              <div
                key={comp.id}
                className="box-white flex justify-between items-center p-3.5 border border-slate-100 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-2 select-none">
                  <span className="text-sm">👤</span>
                  <span className="text-xs font-bold text-dark">{comp.name}</span>
                  <span className="text-[10px] text-gray font-mono">({comp.id})</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold text-primary bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/50">
                    편집 가능
                  </span>
                  <button
                    onClick={() => handleRemoveCompanion(comp.id)}
                    className="w-5 h-5 rounded-full text-slate-400 hover:text-red-500 font-bold text-[10px] flex items-center justify-center transition-colors"
                    title="멤버 제외"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
