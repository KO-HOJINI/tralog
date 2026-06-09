// api.ts - 환경변수 기반 API 기본 URL / 외부 키 관리

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

export const NAVER_MAP_CLIENT_ID =
  import.meta.env.VITE_NAVER_MAP_CLIENT_ID || "";
