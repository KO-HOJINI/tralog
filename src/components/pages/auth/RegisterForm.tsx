import { useState } from "react";

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onToggleLogin: () => void;
}

export default function RegisterForm({
  onRegisterSuccess,
  onToggleLogin,
}: RegisterFormProps) {
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    confirmPassword: "",
    name: "",
    birth: "",
    email: "",
  });

  const [errors, setErrors] = useState({
    id: "",
    password: "",
    confirmPassword: "",
    name: "",
    birth: "",
    email: "",
  });

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      id: "",
      password: "",
      confirmPassword: "",
      name: "",
      birth: "",
      email: "",
    };
    let isValid = true;

    if (!formData.id.trim()) {
      newErrors.id = "필수 입력 항목입니다.";
      isValid = false;
    }
    if (!formData.password.trim()) {
      newErrors.password = "필수 입력 항목입니다.";
      isValid = false;
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "필수 입력 항목입니다.";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
      isValid = false;
    }
    if (!formData.name.trim()) {
      newErrors.name = "필수 입력 항목입니다.";
      isValid = false;
    }
    if (!formData.birth.trim()) {
      newErrors.birth = "필수 입력 항목입니다.";
      isValid = false;
    } else if (formData.birth.length !== 6) {
      newErrors.birth = "생년월일 6자리를 입력해 주세요. (ex. 990101)";
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "필수 입력 항목입니다.";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    // 🛠️ 변경 지점: 로컬스토리지 코드를 제거하고 Node.js 백엔드 API 연동
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: formData.id,
          password: formData.password,
          name: formData.name,
          birth: formData.birth,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("회원가입이 완료되었습니다!");
        onRegisterSuccess();
      } else {
        // 서버에서 던져준 아이디 중복 에러 메시지 처리
        setErrors((prev) => ({
          ...prev,
          id: data.message || "오류가 발생했습니다.",
        }));
      }
    } catch (error) {
      console.error("서버 통신 오류:", error);
      alert("백엔드 서버가 켜져 있는지 확인해 주세요.");
    }
  };

  return (
    <form
      onSubmit={handleRegisterSubmit}
      className="flex flex-col gap-4 w-full h-auto overflow-hidden text-dark"
    >
      {/* 아이디 */}
      <div className="form-control w-full">
        <label className="label py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold text-slate-900">아이디</span>
          {errors.id && (
            <span className="text-xs text-red-500 font-medium">
              {errors.id}
            </span>
          )}
        </label>
        <input
          type="text"
          placeholder="아이디를 입력해주세요"
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            errors.id ? "border-red-500!" : "focus:border-teal-600"
          }`}
        />
      </div>

      {/* 비밀번호 */}
      <div className="form-control w-full">
        <label className="label py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold text-slate-900">비밀번호</span>
          {errors.password && (
            <span className="text-xs text-red-500 font-medium">
              {errors.password}
            </span>
          )}
        </label>
        <input
          type="password"
          placeholder="비밀번호를 입력해주세요"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            errors.password ? "border-red-500!" : "focus:border-teal-600"
          }`}
        />
      </div>

      {/* 비밀번호 확인 */}
      <div className="form-control w-full">
        <label className="label py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold text-slate-900">
            비밀번호 확인
          </span>
          {errors.confirmPassword && (
            <span className="text-xs text-red-500 font-medium">
              {errors.confirmPassword}
            </span>
          )}
        </label>
        <input
          type="password"
          placeholder="비밀번호를 한번 더 입력해주세요"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            errors.confirmPassword ? "border-red-500!" : "focus:border-teal-600"
          }`}
        />
      </div>

      {/* 이름 */}
      <div className="form-control w-full">
        <label className="label py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold text-slate-900">이름</span>
          {errors.name && (
            <span className="text-xs text-red-500 font-medium">
              {errors.name}
            </span>
          )}
        </label>
        <input
          type="text"
          placeholder="홍길동"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            errors.name ? "border-red-500!" : "focus:border-teal-600"
          }`}
        />
      </div>

      {/* 생년월일 */}
      <div className="form-control w-full">
        <label className="label py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold text-slate-900">생년월일</span>
          {errors.birth && (
            <span className="text-xs text-red-500 font-medium">
              {errors.birth}
            </span>
          )}
        </label>
        <input
          type="text"
          placeholder="YYMMDD (6자리)"
          maxLength={6}
          value={formData.birth}
          onChange={(e) => {
            const onlyNums = e.target.value.replace(/[^0-9]/g, "");
            setFormData({ ...formData, birth: onlyNums });
          }}
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            errors.birth ? "border-red-500!" : "focus:border-teal-600"
          }`}
        />
      </div>

      {/* 이메일 */}
      <div className="form-control w-full">
        <label className="label py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold text-slate-900">이메일</span>
          {errors.email && (
            <span className="text-xs text-red-500 font-medium">
              {errors.email}
            </span>
          )}
        </label>
        <input
          type="email"
          placeholder="traveler@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`w-full h-12 px-4 text-sm focus:outline-none input-custom ${
            errors.email ? "border-red-500!" : "focus:border-teal-600"
          }`}
        />
      </div>

      {/* 하단 버튼 영역 */}
      <div className="flex gap-4 mt-5 w-full">
        <button
          type="button"
          onClick={onToggleLogin}
          className="btn btn-custom flex-1 h-12 bg-dark hover:bg-slate-800 text-white font-bold transition-all"
        >
          취소
        </button>
        <button
          type="submit"
          className="btn btn-custom flex-1 h-12 bg-primary hover:bg-teal-700 text-white font-bold transition-all shadow-none"
        >
          회원가입
        </button>
      </div>
    </form>
  );
}
