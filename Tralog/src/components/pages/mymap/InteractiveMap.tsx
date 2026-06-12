// InteractiveMap.tsx - 한국 지도 SVG 컴포넌트
// d3-geo로 GeoJSON 데이터를 SVG 경로로 변환
//
// ※ AI 도움 받은 부분
// 1. d3 geoMercator 투영기 설정 (center, scale, translate 값 계산)
// 2. 제주도는 본토와 좌표 범위가 달라 별도 투영기(인셋 방식)로 분리
// 3. SVG defs의 <pattern>으로 지역 도형에 이미지 채우기
//
// readOnly가 true면 클릭 비활성화 + 대시보드 소형 버전용

import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { MapRecord } from "./MyMapPage";
import { getRegionByCode } from "../../../config/regions";

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

  // 본토 투영기 - geoMercator()로 좌표를 SVG 픽셀로 변환 (※ AI 도움)
  // center/scale/translate 값은 한반도가 잘 보이도록 계산
  const mainProjection = geoMercator()
    .center([128, 36.6])
    .scale(7500)
    .translate([width / 2, height / 2 - 30]);

  // 제주도 투영기 - 본토와 좌표 범위가 달라 별도로 만들어 우측 하단에 배치
  const jejuProjection = geoMercator()
    .center([127, 33.3])
    .scale(8500)
    .translate([width - 25, height - 50]);

  // 울릉도/독도 투영기 - 실제 좌표가 동쪽으로 너무 멀어 화면 밖으로 벗어남
  // 본토와 동일 scale, translate만 왼쪽으로 당겨 동해안 가까이 배치
  const ulleungProjection = geoMercator()
    .center([128, 37])
    .scale(7500)
    .translate([width / 2 - 148, height / 2 - 12]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full select-none"
      style={{
        filter: "drop-shadow(0px 8px 24px rgba(15, 23, 42, 0.04))",
        pointerEvents: readOnly ? "none" : "auto",
      }}
    >
      {/* 대표사진 패턴 정의 (※ AI 도움)
          SVG <defs> 안에 <pattern>을 정의하면 fill로 이미지를 채울 수 있음
          coverImage가 있는 지역만 패턴 생성, 도형 fill에서 url(#pattern-지역명)으로 참조 */}
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
            const regionData = getRegionByCode(feature.properties?.code);
            if (!regionData) return null;
            const regionKey = regionData.name;
            const regionDisplayName = regionData.display;

            const record = mapRecords.find((r) => r.region === regionKey);
            // 완료된 일정이 있는 지역만 대표사진으로 색칠 (진행 중 일정은 제외)
            const hasCover =
              record && record.coverImage && record.hasCompletedSchedule;
            const isSelected = !readOnly && selectedRegion === regionKey;

            // 제주도는 별도 투영기, 나머지는 본토 투영기 사용
            const isJeju = feature.properties?.code === "39";
            const activeProjection = isJeju ? jejuProjection : mainProjection;
            const pathGenerator = geoPath().projection(activeProjection);

            // 경상북도는 본토 + 울릉도/독도로 이루어진 MultiPolygon
            // 본토는 기본 투영기, 멀리 떨어진 섬은 동해안 가까이 당긴 투영기로 따로 그림
            // ※ AI 도움 - MultiPolygon의 각 폴리곤 좌표 개수를 비교해 가장 큰 것을 본토로,
            //   나머지를 섬으로 분리하는 GeoJSON 가공 로직은 AI 도움으로 작성
            const isGyeongbuk = feature.properties?.code === "37";
            let mainFeature: Feature<Geometry, ProvinceProperties> = feature;
            let islandPath = "";
            if (isGyeongbuk && feature.geometry.type === "MultiPolygon") {
              const polys = feature.geometry.coordinates;
              // 면적이 가장 큰 폴리곤을 본토로 간주, 나머지(섬)는 분리
              let mainIdx = 0;
              polys.forEach((poly, i) => {
                if (poly[0].length > polys[mainIdx][0].length) mainIdx = i;
              });
              mainFeature = {
                ...feature,
                geometry: {
                  type: "MultiPolygon",
                  coordinates: [polys[mainIdx]],
                },
              };
              const islandFeature: Feature<Geometry, ProvinceProperties> = {
                type: "Feature",
                properties: feature.properties,
                geometry: {
                  type: "MultiPolygon",
                  coordinates: polys.filter((_, i) => i !== mainIdx),
                },
              };
              islandPath =
                geoPath().projection(ulleungProjection)(islandFeature) || "";
            }

            const dPath = pathGenerator(mainFeature) || "";
            const centroid = pathGenerator.centroid(mainFeature);
            let [labelX, labelY] = centroid || [0, 0];

            // 일부 지역은 라벨 위치가 겹쳐 수동 조정
            if (regionKey === "경기도") {
              labelX += 16;
              labelY += 40;
            }
            if (regionKey === "인천광역시") {
              labelX += 20;
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

                {/* 울릉도/독도: 경북으로 취급, 클릭/스타일 동일 적용 */}
                {islandPath && (
                  <path
                    d={islandPath}
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
                )}

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

      {/* 독도는 GeoJSON에 없어 울릉도 옆에 작은 마커로 직접 표시
          경북 소속이라 경북의 대표사진/선택 상태/클릭을 그대로 따름 */}
      {(() => {
        const dokdoRegionKey = "경상북도";
        const record = mapRecords.find((r) => r.region === dokdoRegionKey);
        const hasCover =
          record && record.coverImage && record.hasCompletedSchedule;
        const isSelected = !readOnly && selectedRegion === dokdoRegionKey;

        const ulleungPt = ulleungProjection([130.85, 37.5]) || [0, 0];
        const dokdoX = ulleungPt[0] + 25;
        const dokdoY = ulleungPt[1] + 15;
        return (
          <circle
            cx={dokdoX}
            cy={dokdoY}
            r={2.4}
            onClick={() =>
              !readOnly && onSelectRegion(isSelected ? null : dokdoRegionKey)
            }
            className={`${!readOnly ? "cursor-pointer transition-all duration-200 hover:fill-teal-500/5" : ""}`}
            fill={
              hasCover
                ? `url(#pattern-${dokdoRegionKey})`
                : isSelected
                  ? "rgba(13, 148, 136, 0.15)"
                  : "#ffffff"
            }
            stroke={isSelected ? "#0d9488" : "#e2e8f0"}
            strokeWidth={isSelected ? "2" : "0.7"}
          />
        );
      })()}

      {/* 제주도 인셋 구역을 점선 테두리로 구분 */}
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
