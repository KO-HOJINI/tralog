// LoginForm.tsx - 로그인 폼
// 아이디/비밀번호 입력 후 서버에 POST 요청을 보냅니다.
// 서버에서 오는 에러 메시지(어떤 필드에서 오류가 났는지)를 각 입력 칸 옆에 표시합니다.

import { useState } from "react";
import { API_BASE_URL } from "../../../config/api";

interface LoginFormProps {
  onLoginSuccess: () => void;
  onToggleRegister: () => void;
}

export default function LoginForm({ onLoginSuccess, onToggleRegister }: LoginFormProps) {
  const [id, setId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [idError, setIdError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(
          "tralog_current_user",
          JSON.stringify({ id: data.id, name: data.name }),
        );
        onLoginSuccess();
      } else {
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-6 animate-fadeIn">
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
          autoComplete="username"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            idError ? "border-red-500!" : ""
          }`}
        />
      </div>

      {/* 비밀번호 입력 */}
      <div className="form-control w-full">
        <label className="label py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold text-slate-900">비밀번호</span>
          {passwordError && (
            <span className="text-xs text-red-500 font-medium">{passwordError}</span>
          )}
        </label>
        <input
          type="password"
          placeholder="비밀번호를 입력해주세요"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            passwordError ? "border-red-500!" : ""
          }`}
        />
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-6 mt-2 w-full">
        <button
          type="button"
          onClick={onToggleRegister}
          disabled={isLoading}
          className="btn-dark flex-1 h-12"
        >
          <h3 className="text-white">회원가입</h3>
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1 h-12"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-md text-white" />
          ) : (
            <h3 className="text-white">로그인</h3>
          )}
        </button>
      </div>
    </form>
  );
}