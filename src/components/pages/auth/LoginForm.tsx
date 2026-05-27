import { useState } from "react";

interface LoginFormProps {
  onLoginSuccess: () => void;
  onToggleRegister: () => void;
}

export default function LoginForm({
  onLoginSuccess,
  onToggleRegister,
}: LoginFormProps) {
  const [id, setId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [idError, setIdError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdError("");
    setPasswordError("");

    let isValid = true;
    if (!id.trim()) {
      setIdError("아이디를 입력해 주세요.");
      isValid = false;
    }
    if (!password.trim()) {
      setPasswordError("비밀번호를 입력해 주세요.");
      isValid = false;
    }
    if (!isValid) return;

    // 🛠️ 변경 지점: 로컬스토리지의 유저 탐색 코드를 지우고 백엔드 API 연동
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 현재 유저의 상태 관리를 위한 대시보드 호환용 세션 저장 (id, name 보관)
        localStorage.setItem(
          "tralog_current_user",
          JSON.stringify({ id: data.id, name: data.name }),
        );
        onLoginSuccess();
      } else {
        // 서버에서 가공해 보낸 정밀 필드 에러 맵핑
        if (data.field === "id") {
          setIdError(data.message);
        } else if (data.field === "password") {
          setPasswordError(data.message);
        } else {
          alert(data.message || "로그인 실패");
        }
      }
    } catch (error) {
      console.error("서버 통신 오류:", error);
      alert("백엔드 서버가 작동 중인지 확인해 주세요.");
    }
  };

  return (
    <form
      onSubmit={handleLoginSubmit}
      className="flex flex-col gap-6 animate-fadeIn"
    >
      {/* 아이디 입력 */}
      <div className="form-control w-full">
        <label className="label py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold text-slate-900">아이디</span>
          {idError && (
            <span className="text-xs text-red-500 font-medium">{idError}</span>
          )}
        </label>
        <input
          type="text"
          placeholder="아이디를 입력해주세요"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            idError ? "border-red-500!" : "focus:border-teal-600"
          }`}
        />
      </div>

      {/* 비밀번호 입력 */}
      <div className="form-control w-full">
        <label className="label py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold text-slate-900">비밀번호</span>
          {passwordError && (
            <span className="text-xs text-red-500 font-medium">
              {passwordError}
            </span>
          )}
        </label>
        <input
          type="password"
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            passwordError ? "border-red-500!" : "focus:border-teal-600"
          }`}
        />
      </div>

      <div className="flex gap-6 mt-2 w-full">
        <button
          type="button"
          onClick={onToggleRegister}
          className="btn btn-custom flex-1 h-12 bg-dark hover:bg-slate-800"
        >
          <h3 className="text-white">회원가입</h3>
        </button>
        <button
          type="submit"
          className="btn btn-custom flex-1 h-12 bg-primary hover:bg-teal-700"
        >
          <h3 className="text-white">로그인</h3>
        </button>
      </div>
    </form>
  );
}
