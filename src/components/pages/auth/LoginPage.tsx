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
      {/* 32px 라운드 및 공동안내 그림자 유틸리티 바인딩 */}
      <motion.div
        animate={{ height: contentHeight }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="box-custom w-full max-w-md bg-white overflow-hidden border border-slate-100"
      >
        <div ref={contentRef} className="p-10 h-auto overflow-hidden">
          {/* 로고 */}
          <div className="text-center mb-8">
            <h1 className="text-logo text-slate-900 select-none tracking-tight">
              Tralog
            </h1>
          </div>

          {/* 폼 애니메이션 전환 */}
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
