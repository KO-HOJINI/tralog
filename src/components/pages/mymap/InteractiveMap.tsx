import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { MapRecord } from "./MyMapPage";

import koreaGeoJson from "../../content/korea-provinces.json";

interface InteractiveMapProps {
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
  mapRecords: MapRecord[];
  readOnly?: boolean; // 대시보드 오버뷰 모드
}

interface ProvinceProperties {
  code: string;
  name: string;
  name_eng: string;
}

const geoData = koreaGeoJson as unknown as FeatureCollection<
  Geometry,
  ProvinceProperties
>;

export default function InteractiveMap({
  selectedRegion,
  onSelectRegion,
  mapRecords,
  readOnly = false,
}: InteractiveMapProps) {
  const width = 500;
  const height = 750;

  // 1. 본토(제주 제외 전 지역)를 위한 메인 투영기 정의
  const mainProjection = geoMercator()
    .center([128, 36.6]) // 중심을 충청/강원 쪽으로 올려서 본토 확대 극대화
    .scale(7500) // 본토를 화면에 아주 큼직하게 꽉 채움
    .translate([width / 2, height / 2 - 30]);

  // 2. [핵심] 제주도만을 위한 별도의 미니 투영기 정의 (인셋 맵 효과)
  const jejuProjection = geoMercator()
    .center([127, 33.3]) // 원래 제주도 위경도 중심선 잡기
    .scale(8500) // 본토와 동일하게 큼직한 비율 유지
    .translate([width - 25, height - 50]); // 지도의 "오른쪽 아래" 영역으로 강제 배치 공간 재조정

  const getRegionInfo = (feature: Feature<Geometry, ProvinceProperties>) => {
    const code = feature.properties?.code;
    switch (code) {
      case "11":
        return { key: "서울특별시", display: "서울" };
      case "21":
        return { key: "부산광역시", display: "부산" };
      case "22":
        return { key: "대구광역시", display: "대구" };
      case "23":
        return { key: "인천광역시", display: "인천" };
      case "24":
        return { key: "광주광역시", display: "광주" };
      case "25":
        return { key: "대전광역시", display: "대전" };
      case "26":
        return { key: "울산광역시", display: "울산" };
      case "29":
        return { key: "세종특별자치시", display: "세종" };
      case "31":
        return { key: "경기도", display: "경기" };
      case "32":
        return { key: "강원특별자치도", display: "강원" };
      case "33":
        return { key: "충청북도", display: "충북" };
      case "34":
        return { key: "충청남도", display: "충남" };
      case "35":
        return { key: "전북특별자치도", display: "전북" };
      case "36":
        return { key: "전라남도", display: "전남" };
      case "37":
        return { key: "경상북도", display: "경북" };
      case "38":
        return { key: "경상남도", display: "경남" };
      case "39":
        return { key: "제주특별자치도", display: "제주" };
      default:
        return { key: "", display: "" };
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
                x="0"
                y="0"
                width="1"
                height="1"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          );
        })}
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {geoData.features.map(
          (feature: Feature<Geometry, ProvinceProperties>, index) => {
            const { key: regionKey, display: regionDisplayName } =
              getRegionInfo(feature);
            if (!regionKey) return null;

            const record = mapRecords.find((r) => r.region === regionKey);
            const hasCover = record && record.coverImage;
            const isSelected = !readOnly && selectedRegion === regionKey;

            // 제주도(코드 39)인지 판별하여 각기 다른 투영 변환 경로(Path) 연결
            const isJeju = feature.properties?.code === "39";
            const activeProjection = isJeju ? jejuProjection : mainProjection;
            const pathGenerator = geoPath().projection(activeProjection);

            const dPath = pathGenerator(feature) || "";
            const centroid = pathGenerator.centroid(feature);
            let [labelX, labelY] = centroid || [0, 0];

            // 라벨 오프셋 조정
            if (regionKey === "경기도") {
              labelX += 16;
              labelY += 40;
            }
            if (regionKey === "인천광역시") {
              labelX -= 15;
              labelY += 15;
            }
            if (regionKey === "충청남도") {
              labelX -= 12;
            }
            if (regionKey === "서울특별시") {
              labelY += 2;
            }
            if (regionKey === "제주특별자치도") {
              labelY += 5;
            }

            return (
              <g key={index}>
                <path
                  d={dPath}
                  onClick={() =>
                    !readOnly && onSelectRegion(isSelected ? null : regionKey)
                  }
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
          },
        )}
      </g>

      {/* --- 제주도 전용 인셋(외곽 미니 가이드 박스 라인) 디자인 추가 --- */}
      <rect
        x={width - 165}
        y={height - 110}
        width={150}
        height={90}
        rx={12}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="1"
        strokeDasharray="4 4" // 점선 테두리로 은은하고 고급스럽게 표현
        className="pointer-events-none"
      />
    </svg>
  );
}
