// date.ts - 날짜 변환 공통 유틸
// 서버가 ISO 형식("T" 포함)으로 내려줄 때 생기는 시차 오류를 막기 위해
// 로컬 기준으로 날짜를 다루는 함수들을 한 곳에 모음

// ISO 형식("T" 포함)이면 로컬 날짜 기준 YYYY-MM-DD 문자열로 변환.
// 이미 "YYYY-MM-DD..." 형태면 앞 10자리만 사용.
export function formatLocalDateString(rawDate: string | undefined): string {
  if (!rawDate) return "";
  if (rawDate.includes("T")) {
    const dateObj = new Date(rawDate);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return rawDate.slice(0, 10);
}

// "T"가 포함된 ISO 날짜 문자열을 로컬 Date 객체로 변환 (시차로 날짜가 밀리지 않게 함)
export function parseLocalDate(raw: string): Date {
  const dateStr = raw.split("T")[0];
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Date 객체를 로컬 기준 YYYY-MM-DD 문자열로 변환
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
