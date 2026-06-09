// LoginPage.tsx - 로그인 / 회원가입 전환 페이지
// framer-motion으로 폼 전환 시 페이드 애니메이션 처리
//
// ※ AI 도움 - 카드 높이를 폼에 맞춰 자연스럽게 늘리는 부분
// ResizeObserver로 폼 높이를 감지해 framer-motion animate에 전달 (사용법을 몰라 도움받음)

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [contentHeight, setContentHeight] = useState<number | string>("auto");
  const contentRef = useRef<HTMLDivElement>(null);

  // 폼이 바뀔 때마다 높이를 측정해 카드 높이 애니메이션에 전달 (※ AI 도움)
  // ResizeObserver = DOM 요소의 크기 변화를 실시간 감지하는 Web API
  useEffect(() => {
    if (!contentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (element) {
          setContentHeight(element.offsetHeight);
        }
      }
    });

    resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4">
      {/* 카드 높이 애니메이션 */}
      <motion.div
        animate={{ height: contentHeight }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="box-white w-full max-w-md overflow-hidden"
      >
        <div ref={contentRef} className="p-10 h-auto overflow-hidden">

          {/* 로고 */}
          <div className="text-center mb-8">
            <h1 className="text-logo text-slate-900 select-none tracking-tight">
              Tralog
            </h1>
          </div>

          {/* 로그인 / 회원가입 폼 전환 */}
          <AnimatePresence mode="wait">
            {!isRegister ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <LoginForm
                  onLoginSuccess={() => onNavigate("dashboard")}
                  onToggleRegister={() => setIsRegister(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <RegisterForm
                  onRegisterSuccess={() => setIsRegister(false)}
                  onToggleLogin={() => setIsRegister(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
