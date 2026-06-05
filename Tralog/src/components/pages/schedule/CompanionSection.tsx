// CompanionSection.tsx - 일행 추가 섹션
// 아이디를 검색해서 일정에 일행을 초대하고 읽기/편집 권한을 설정합니다.
// 일행 데이터 로직은 useCompanion 훅으로 분리했습니다.

import { useState } from "react";
import { useCompanion } from "./hooks/useCompanion";

interface CompanionSectionProps {
  userId: string;
  scheduleId: string;
  scheduleTitle?: string;
  schedulePeriod?: string;
}

export default function CompanionSection({
  userId,
  scheduleId,
  scheduleTitle,
  schedulePeriod,
}: CompanionSectionProps) {
  const [searchId, setSearchId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"read" | "edit">("read");

  const { companions, isLoading, message, addCompanion, removeCompanion } = useCompanion(
    scheduleId,
    userId
  );

  const handleAddCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addCompanion(searchId, selectedRole);
    if (success) setSearchId("");
  };

  return (
    <div className="p-6 h-full flex flex-col gap-5 overflow-hidden bg-white">
      {scheduleTitle && (
        <div className="pb-4 border-b border-slate-100 shrink-0 select-none">
          <h2 className="font-black text-dark m-0 mb-1">{scheduleTitle}</h2>
          {schedulePeriod && (
            <span className="text-xs font-bold text-slate-500">
              {schedulePeriod}
            </span>
          )}
        </div>
      )}

      {/* 동반자 추가 인풋 및 권한 선택 */}
      <div className="shrink-0">
        <p className="text-xs font-bold text-dark mb-2 select-none">
          일행의 ID와 권한을 선택하세요
        </p>
        <form onSubmit={handleAddCompanion} className="flex gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as "read" | "edit")}
            className="w-24 h-11 px-2 text-xs font-bold input-custom focus:outline-none shrink-0"
          >
            <option value="read">읽기 전용</option>
            <option value="edit">편집 가능</option>
          </select>
          <input
            type="text"
            placeholder="아이디 입력"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 h-11 px-4 text-xs focus:outline-none input-custom"
          />
          <button type="submit" className="btn-primary h-11 px-5 text-xs shrink-0">
            추가
          </button>
        </form>
        {message && (
          <p
            className={`text-[11px] font-bold px-1 mt-1.5 ${
              message.startsWith("✅") ? "text-primary" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* 멤버 목록 렌더링 */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        <p className="text-xs font-bold text-gray select-none shrink-0">
          참여 중인 멤버 ({companions.length}명)
        </p>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : companions.length === 0 ? (
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
                  <span
                    className={`badge badge-sm ${
                      comp.role === "edit"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-slate-100 text-slate-500 border-0"
                    }`}
                  >
                    {comp.role === "edit" ? "편집 가능" : "읽기 전용"}
                  </span>
                  <button
                    onClick={() => removeCompanion(comp.id)}
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