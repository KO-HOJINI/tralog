// InteractiveMap.tsx - 한국 지도 SVG 컴포넌트
// d3-geo 라이브러리를 사용해서 GeoJSON 데이터를 SVG 경로로 변환했습니다.
//
// ※ AI 도움을 받아 구현한 부분들
// 1. d3의 geoMercator 투영기 설정 방법 (center, scale, translate 값 계산)
// 2. 제주도는 본토와 좌표 범위가 달라서 별도 투영기(인셋 방식)로 분리했는데,
//    이 인셋 맵 구현 방식
// 3. SVG defs의 <pattern>으로 지역 도형에 이미지를 채우는 방법
//
// readOnly prop이 true면 클릭 비활성화 + 대시보드 소형 버전용으로 사용합니다.

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

  // ※ AI 도움을 받아 구현했습니다
  // geoMercator()로 좌표를 SVG 픽셀로 변환하는 투영기를 만듭니다.
  // center, scale, translate 값은 한반도가 잘 보이도록 AI가 계산해줬습니다.
  const mainProjection = geoMercator()
    .center([128, 36.6])
    .scale(7500)
    .translate([width / 2, height / 2 - 30]);

  // 제주도는 본토와 좌표 범위가 달라서 별도 투영기를 만들어 오른쪽 아래에 배치했습니다.
  const jejuProjection = geoMercator()
    .center([127, 33.3])
    .scale(8500)
    .translate([width - 25, height - 50]);

  // GeoJSON의 code 값을 한국어 지역명으로 변환합니다
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
      {/* ※ AI 도움을 받아 구현했습니다
          SVG의 <defs> 안에 <pattern>을 정의하면 fill로 이미지를 채울 수 있습니다.
          coverImage가 있는 지역만 패턴을 만들고, 지역 도형의 fill에 url(#pattern-지역명)으로 참조합니다. */}
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

          // 제주도는 별도 투영기, 나머지는 기본 투영기 사용
          const isJeju = feature.properties?.code === "39";
          const activeProjection = isJeju ? jejuProjection : mainProjection;
          const pathGenerator = geoPath().projection(activeProjection);

          const dPath = pathGenerator(feature) || "";
          const centroid = pathGenerator.centroid(feature);
          let [labelX, labelY] = centroid || [0, 0];

          // 일부 지역의 라벨 위치가 겹쳐서 수동으로 조정했습니다
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

      {/* 제주도 인셋 구역을 점선 테두리로 구분합니다 */}
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
