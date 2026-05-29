// ===================================================
// InteractiveMap.tsx - 한국 지도 SVG 컴포넌트
//
// d3-geo 라이브러리로 GeoJSON → SVG 경로 변환
// 제주도는 본토랑 다른 좌표계라 별도 투영기(inset 방식)로 처리함
//
// AI 도움:
//   - d3 geoMercator 투영기 설정 방법 (center, scale, translate)
//   - 제주도 인셋 맵 구현 방식 (별도 projection 적용)
//   - SVG defs > pattern으로 지역에 이미지 채우는 방법
//
// readOnly prop: true면 클릭 비활성화 + 대시보드 소형 버전용
// ===================================================

import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { MapRecord } from "./MyMapPage";

import koreaGeoJson from "../../content/korea-provinces.json";

interface InteractiveMapProps {
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
  mapRecords: MapRecord[];
  readOnly?: boolean;
}

interface ProvinceProperties {
  code: string;
  name: string;
  name_eng: string;
}

const geoData = koreaGeoJson as unknown as FeatureCollection<Geometry, ProvinceProperties>;

export default function InteractiveMap({
  selectedRegion,
  onSelectRegion,
  mapRecords,
  readOnly = false,
}: InteractiveMapProps) {
  const width = 500;
  const height = 750;

  // 본토용 투영기 (제주 제외)
  const mainProjection = geoMercator()
    .center([128, 36.6])
    .scale(7500)
    .translate([width / 2, height / 2 - 30]);

  // 제주도 전용 투영기 (오른쪽 아래 인셋으로 배치)
  // AI 도움: 인셋 맵 방식으로 분리 구현
  const jejuProjection = geoMercator()
    .center([127, 33.3])
    .scale(8500)
    .translate([width - 25, height - 50]);

  // GeoJSON feature의 code → 한국어 지역명 매핑
  const getRegionInfo = (feature: Feature<Geometry, ProvinceProperties>) => {
    const code = feature.properties?.code;
    switch (code) {
      case "11": return { key: "서울특별시",     display: "서울" };
      case "21": return { key: "부산광역시",     display: "부산" };
      case "22": return { key: "대구광역시",     display: "대구" };
      case "23": return { key: "인천광역시",     display: "인천" };
      case "24": return { key: "광주광역시",     display: "광주" };
      case "25": return { key: "대전광역시",     display: "대전" };
      case "26": return { key: "울산광역시",     display: "울산" };
      case "29": return { key: "세종특별자치시", display: "세종" };
      case "31": return { key: "경기도",         display: "경기" };
      case "32": return { key: "강원특별자치도", display: "강원" };
      case "33": return { key: "충청북도",       display: "충북" };
      case "34": return { key: "충청남도",       display: "충남" };
      case "35": return { key: "전북특별자치도", display: "전북" };
      case "36": return { key: "전라남도",       display: "전남" };
      case "37": return { key: "경상북도",       display: "경북" };
      case "38": return { key: "경상남도",       display: "경남" };
      case "39": return { key: "제주특별자치도", display: "제주" };
      default:   return { key: "",              display: "" };
    }
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full select-none"
      style={{
        filter: "drop-shadow(0px 8px 24px rgba(15, 23, 42, 0.04))",
        pointerEvents: readOnly ? "none" : "auto",
      }}
    >
      {/* 대표 이미지를 지역 fill로 쓰기 위한 SVG pattern 정의 */}
      <defs>
        {mapRecords.map((record) => {
          if (!record.coverImage) return null;
          return (
            <pattern
              key={`pattern-${record.region}`}
              id={`pattern-${record.region}`}
              patternContentUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <image
                href={record.coverImage}
                x="0" y="0" width="1" height="1"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          );
        })}
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {geoData.features.map((feature: Feature<Geometry, ProvinceProperties>, index) => {
          const { key: regionKey, display: regionDisplayName } = getRegionInfo(feature);
          if (!regionKey) return null;

          const record = mapRecords.find((r) => r.region === regionKey);
          const hasCover = record && record.coverImage;
          const isSelected = !readOnly && selectedRegion === regionKey;

          // 제주는 별도 투영기 사용
          const isJeju = feature.properties?.code === "39";
          const activeProjection = isJeju ? jejuProjection : mainProjection;
          const pathGenerator = geoPath().projection(activeProjection);

          const dPath = pathGenerator(feature) || "";
          const centroid = pathGenerator.centroid(feature);
          let [labelX, labelY] = centroid || [0, 0];

          // 일부 지역 라벨이 겹쳐서 수동으로 오프셋 조정
          if (regionKey === "경기도")       { labelX += 16; labelY += 40; }
          if (regionKey === "인천광역시")   { labelX += 20; labelY += 15; }
          if (regionKey === "충청남도")     { labelX -= 12; }
          if (regionKey === "서울특별시")   { labelY += 2; }
          if (regionKey === "제주특별자치도") { labelY += 5; }

          return (
            <g key={index}>
              <path
                d={dPath}
                onClick={() => !readOnly && onSelectRegion(isSelected ? null : regionKey)}
                className={`${!readOnly ? "cursor-pointer transition-all duration-200 hover:fill-teal-500/5" : ""}`}
                fill={
                  hasCover
                    ? `url(#pattern-${regionKey})`
                    : isSelected
                      ? "rgba(13, 148, 136, 0.15)"
                      : "#ffffff"
                }
                stroke={isSelected ? "#0d9488" : "#e2e8f0"}
                strokeWidth={isSelected ? "2" : "0.7"}
              />

              {labelX && labelY && (
                <text
                  x={labelX}
                  y={labelY}
                  className={`pointer-events-none transition-all duration-200 ${
                    readOnly
                      ? "text-[10px] font-medium fill-gray/80"
                      : isSelected
                        ? "text-[12px] font-bold fill-primary"
                        : "text-body-caption font-bold fill-gray/60"
                  } ${hasCover ? "fill-pure-white font-bold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)]" : ""}`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {regionDisplayName}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* 제주도 인셋 영역 점선 테두리 */}
      <rect
        x={width - 165}
        y={height - 110}
        width={150}
        height={90}
        rx={12}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="1"
        strokeDasharray="4 4"
        className="pointer-events-none"
      />
    </svg>
  );
}
