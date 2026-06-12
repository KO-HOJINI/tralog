// regions.ts - 지역(광역시/도) 공통 데이터
// 지역명 표기 · 지도 중심 좌표 · GeoJSON 코드 매핑을 한 곳에서 관리해
// 파일마다 흩어진 중복과 표기 불일치(예: 전라북도 vs 전북특별자치도)를 방지

export interface RegionInfo {
  code: string; // GeoJSON properties.code (지도 도형 매칭용)
  name: string; // 정식 명칭 (DB 저장값 · 드롭다운 값)
  display: string; // 지도 라벨용 짧은 이름
  lat: number; // 지도 중심 위도
  lng: number; // 지도 중심 경도
}

// 표시 순서 = 드롭다운에 노출되는 순서
export const REGIONS: RegionInfo[] = [
  { code: "11", name: "서울특별시", display: "서울", lat: 37.5665, lng: 126.978 },
  { code: "21", name: "부산광역시", display: "부산", lat: 35.1796, lng: 129.0756 },
  { code: "22", name: "대구광역시", display: "대구", lat: 35.8714, lng: 128.6014 },
  { code: "23", name: "인천광역시", display: "인천", lat: 37.4563, lng: 126.7052 },
  { code: "24", name: "광주광역시", display: "광주", lat: 35.1595, lng: 126.8526 },
  { code: "25", name: "대전광역시", display: "대전", lat: 36.3504, lng: 127.3845 },
  { code: "26", name: "울산광역시", display: "울산", lat: 35.5384, lng: 129.3114 },
  { code: "29", name: "세종특별자치시", display: "세종", lat: 36.4801, lng: 127.289 },
  { code: "31", name: "경기도", display: "경기", lat: 37.2752, lng: 127.0095 },
  { code: "32", name: "강원특별자치도", display: "강원", lat: 37.751853, lng: 128.876057 },
  { code: "33", name: "충청북도", display: "충북", lat: 36.6357, lng: 127.4917 },
  { code: "34", name: "충청남도", display: "충남", lat: 36.4599, lng: 127.126 },
  { code: "35", name: "전북특별자치도", display: "전북", lat: 35.8242, lng: 127.148 },
  { code: "36", name: "전라남도", display: "전남", lat: 34.7604, lng: 127.6622 },
  { code: "37", name: "경상북도", display: "경북", lat: 35.856171, lng: 129.224748 },
  { code: "38", name: "경상남도", display: "경남", lat: 34.8544, lng: 128.4331 },
  { code: "39", name: "제주특별자치도", display: "제주", lat: 33.4996, lng: 126.5312 },
];

// 드롭다운 옵션 (정식 명칭 목록)
export const REGION_OPTIONS = REGIONS.map((r) => r.name);

// 옛 명칭으로 저장된 기존 데이터 호환용 별칭 (특별자치도 개편 전 표기)
const LEGACY_ALIASES: Record<string, string> = {
  강원도: "강원특별자치도",
  전라북도: "전북특별자치도",
  제주도: "제주특별자치도",
};

// 지역 미매칭 시 폴백 좌표 (서울 시청)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

// 지역명 -> 지도 중심 좌표 (옛 명칭도 별칭으로 매칭)
export function getRegionCenter(region: string): { lat: number; lng: number } {
  const name = LEGACY_ALIASES[region] ?? region;
  const found = REGIONS.find((r) => r.name === name);
  return found ? { lat: found.lat, lng: found.lng } : DEFAULT_CENTER;
}

// GeoJSON code -> 지역 정보 (지도 도형 매칭용)
export function getRegionByCode(
  code: string | undefined,
): RegionInfo | undefined {
  return REGIONS.find((r) => r.code === code);
}
