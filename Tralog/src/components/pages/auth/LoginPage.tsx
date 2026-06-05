// LoginPage.tsx - 로그인 / 회원가입 전환 페이지
// framer-motion으로 폼 전환 시 페이드 애니메이션을 구현했습니다.
//
// ※ AI 도움을 받아 구현한 부분
// 카드 높이가 폼에 따라 자연스럽게 늘어나는 효과를 만들기 위해
// ResizeObserver로 폼 높이를 감지하고 framer-motion의 animate로 전달했습니다.
// ResizeObserver 사용법을 잘 몰라서 AI 도움을 받았습니다.

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

  // ※ AI 도움을 받아 구현했습니다
  // 폼이 바뀔 때마다 높이를 측정해서 카드 높이 애니메이션에 넘겨줍니다.
  // ResizeObserver는 DOM 요소의 크기 변화를 실시간으로 감지해주는 Web API입니다.
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

          {/* 로그인 - 회원가입 폼 전환 */}
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
