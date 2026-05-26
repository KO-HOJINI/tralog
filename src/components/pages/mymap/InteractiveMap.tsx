import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { MapRecord } from "./MyMapPage";

import koreaGeoJson from "../../../../public/content/korea-provinces.json";

interface InteractiveMapProps {
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
  mapRecords: MapRecord[];
}

interface ProvinceProperties {
  code: string;
  name: string;
  name_eng: string;
}

// 빌드 타임에 JSON 타입을 GeoJSON 표준 타입 스펙으로 안전하게 단언(Casting)합니다.
const geoData = koreaGeoJson as unknown as FeatureCollection<
  Geometry,
  ProvinceProperties
>;

export default function InteractiveMap({
  selectedRegion,
  onSelectRegion,
  mapRecords,
}: InteractiveMapProps) {
  // SVG 도화지 크기 설정
  const width = 500;
  const height = 600;

  // 대한민국 중심부 좌표 투영 설정
  const projection = geoMercator()
    .center([127.6, 35.9]) // 대한민국의 실제 지리적 중심점 좌표 [경도, 위도]
    .scale(5800) // 지도의 크기 (줌 레벨)
    .translate([width / 2, height / 2]); // SVG 박스 정중앙에 위치하도록 평행이동

  // 투영된 좌표를 바탕으로 SVG <path>의 d 속성 문자열을 생성하는 제너레이터
  const pathGenerator = geoPath().projection(projection);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full max-h-[520px] select-none"
      style={{ filter: "drop-shadow(0px 8px 20px rgba(15, 23, 42, 0.05))" }}
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
            if (!feature.properties) return null;

            const regionName = feature.properties.name;
            const record = mapRecords.find((r) => r.region === regionName);
            const hasCover = record && record.coverImage;
            const isSelected = selectedRegion === regionName;

            const dPath = pathGenerator(feature) || "";

            // 무게중심 좌표(Centroid) 계산
            const centroid = pathGenerator.centroid(feature);
            const labelX = centroid ? centroid[0] : 0;
            const labelY = centroid ? centroid[1] : 0;

            return (
              <g key={index} className="group">
                <path
                  d={dPath}
                  onClick={() => onSelectRegion(isSelected ? null : regionName)}
                  className="cursor-pointer transition-all duration-200 hover:fill-teal-500/10"
                  fill={
                    hasCover
                      ? `url(#pattern-${regionName})`
                      : isSelected
                        ? "rgba(13, 148, 136, 0.18)"
                        : "#ffffff"
                  }
                  stroke={isSelected ? "#0d9488" : "#cbd5e1"}
                  strokeWidth={isSelected ? "2" : "0.8"}
                  style={{
                    filter: isSelected
                      ? "drop-shadow(0px 0px 8px rgba(13, 148, 136, 0.4))"
                      : "none",
                  }}
                />

                {labelX && labelY && (
                  <text
                    x={labelX}
                    y={labelY}
                    className={`pointer-events-none text-[10px] font-bold transition-all duration-200 ${
                      isSelected
                        ? "fill-teal-700 text-[11px]"
                        : "fill-slate-500"
                    } ${
                      hasCover
                        ? "fill-white font-extrabold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] text-[10px]"
                        : ""
                    }`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {regionName.slice(0, 2)}
                  </text>
                )}
              </g>
            );
          },
        )}
      </g>
    </svg>
  );
}
