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

  const handleLoginSubmit = (e: React.FormEvent) => {
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

    const existingUsers = JSON.parse(
      localStorage.getItem("tralog_users_list") || "[]",
    );
    const matchedUser = existingUsers.find(
      (user: { id: string }) => user.id === id,
    );

    if (!matchedUser) {
      setIdError("등록되지 않은 아이디입니다.");
      return;
    }
    if (matchedUser.password !== password) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }

    localStorage.setItem(
      "tralog_current_user",
      JSON.stringify({ id: matchedUser.id, name: matchedUser.name || id }),
    );
    onLoginSuccess();
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
