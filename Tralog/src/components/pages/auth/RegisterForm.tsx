// RegisterForm.tsx - 회원가입 폼
// 아이디/비밀번호/이름/생년월일/이메일을 입력받아 서버에 POST 요청
// 비밀번호 확인 일치, 필수 항목 등 클라이언트 측 유효성 검사 먼저 수행

import { useState } from "react";
import { API_BASE_URL } from "../../../config/api";

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onToggleLogin: () => void;
}

export default function RegisterForm({
  onRegisterSuccess,
  onToggleLogin,
}: RegisterFormProps) {
  // 회원가입 입력 폼 값
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    confirmPassword: "",
    name: "",
    birth: "",
    email: "",
  });

  // 필드별 유효성 에러 메시지
  const [errors, setErrors] = useState({
    id: "",
    password: "",
    confirmPassword: "",
    name: "",
    birth: "",
    email: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false); // 가입 요청 진행 중 여부

  // 회원가입 제출 - 필수/형식 검증 후 서버에 등록 요청
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 항목별 유효성 검사 (빈 칸, 형식, 길이 제한 / DB 컬럼 길이와 맞춤)
    const newErrors = {
      id: "",
      password: "",
      confirmPassword: "",
      name: "",
      birth: "",
      email: "",
    };
    let isValid = true;

    // 아이디: 영문/숫자/언더스코어 4~20자
    if (!formData.id.trim()) {
      newErrors.id = "필수 입력 항목입니다.";
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]{4,20}$/.test(formData.id)) {
      newErrors.id = "영문/숫자/_ 조합 4~20자로 입력해 주세요.";
      isValid = false;
    }

    // 비밀번호: 8~20자, 영문과 숫자를 모두 포함
    if (!formData.password) {
      newErrors.password = "필수 입력 항목입니다.";
      isValid = false;
    } else if (formData.password.length < 8 || formData.password.length > 20) {
      newErrors.password = "비밀번호는 8~20자로 입력해 주세요.";
      isValid = false;
    } else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(formData.password)) {
      // ※ AI 도움 - 전방탐색(lookahead) (?=.*[A-Za-z])(?=.*\d)으로
      //   "영문과 숫자를 각각 최소 1개씩 포함" 조건을 한 정규식으로 검사
      newErrors.password = "영문과 숫자를 모두 포함해 주세요.";
      isValid = false;
    }

    // 비밀번호 확인: 일치 여부
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "필수 입력 항목입니다.";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
      isValid = false;
    }

    // 이름: 한글/영문 2~20자 (공백 제외)
    if (!formData.name.trim()) {
      newErrors.name = "필수 입력 항목입니다.";
      isValid = false;
    } else if (!/^[가-힣a-zA-Z]{2,20}$/.test(formData.name.trim())) {
      newErrors.name = "이름은 한글 또는 영문 2~20자로 입력해 주세요.";
      isValid = false;
    }

    // 생년월일: 6자리 숫자 + 실제 존재하는 월/일
    if (!formData.birth.trim()) {
      newErrors.birth = "필수 입력 항목입니다.";
      isValid = false;
    } else if (!/^\d{6}$/.test(formData.birth)) {
      newErrors.birth = "생년월일 6자리를 입력해 주세요. (ex. 990101)";
      isValid = false;
    } else {
      const month = Number(formData.birth.slice(2, 4));
      const day = Number(formData.birth.slice(4, 6));
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        newErrors.birth = "올바른 생년월일을 입력해 주세요. (ex. 990101)";
        isValid = false;
      }
    }

    // 이메일: 형식 + 100자 이하
    if (!formData.email.trim()) {
      newErrors.email = "필수 입력 항목입니다.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
      isValid = false;
    } else if (formData.email.length > 100) {
      newErrors.email = "이메일은 100자 이하로 입력해 주세요.";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    setIsLoading(true);
    try {
      // 서버에 회원가입 요청
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setErrors((prev) => ({
          ...prev,
          id: data.message || "오류가 발생했습니다.",
        }));
      }
    } catch (error) {
      console.error("서버 통신 오류:", error);
      alert("백엔드 서버가 켜져 있는지 확인해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 입력 칸 공통 스타일 - 에러가 있으면 빨간 테두리 추가
  const inputClass = (errorKey: keyof typeof errors) =>
    `w-full h-12 px-4 text-sm focus:outline-none input-custom ${
      errors[errorKey] ? "border-red-500!" : ""
    }`;

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
          placeholder="아이디를 입력해주세요 (영문/숫자 4~20자)"
          autoComplete="username"
          maxLength={20}
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          className={inputClass("id")}
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
          placeholder="영문+숫자 8~20자"
          autoComplete="new-password"
          maxLength={20}
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className={inputClass("password")}
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
          autoComplete="new-password"
          maxLength={20}
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          className={inputClass("confirmPassword")}
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
          autoComplete="name"
          maxLength={20}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={inputClass("name")}
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
          className={inputClass("birth")}
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
          autoComplete="email"
          maxLength={100}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={inputClass("email")}
        />
      </div>

      {/* 취소 / 회원가입 버튼 */}
      <div className="flex gap-4 mt-5 w-full">
        <button
          type="button"
          onClick={onToggleLogin}
          disabled={isLoading}
          className="btn-dark flex-1 h-12"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1 h-12"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-md text-white" />
          ) : (
            "회원가입"
          )}
        </button>
      </div>
    </form>
  );
}
