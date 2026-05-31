// src/config/api.ts
// 환경변수로 API 기본 URL을 관리합니다.
// .env 파일에 VITE_API_BASE_URL=http://localhost:5000 을 설정하세요.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const NAVER_MAP_CLIENT_ID =
  import.meta.env.VITE_NAVER_MAP_CLIENT_ID || "9ffc0uiggv";
