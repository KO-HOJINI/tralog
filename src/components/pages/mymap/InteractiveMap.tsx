import type { MapRecord } from "./MyMapPage";

interface InteractiveMapProps {
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
  mapRecords: MapRecord[];
}

export default function InteractiveMap({
  selectedRegion,
  onSelectRegion,
  mapRecords,
}: InteractiveMapProps) {
  // 대한민국 대표 주요 행정구역 레이아웃 및 패스 좌표 데이터 설정
  const regions = [
    { id: "seoul", name: "서울특별시", d: "M 42,55 L 52,50 L 56,58 L 46,64 Z" },
    {
      id: "incheon",
      name: "인천광역시",
      d: "M 28,56 L 40,54 L 36,64 L 26,62 Z",
    },
    {
      id: "busan",
      name: "부산광역시",
      d: "M 82,130 L 94,124 L 90,136 L 78,140 Z",
    },
    {
      id: "jeju",
      name: "제주시",
      d: "M 36,175 Q 56,168 76,175 Q 56,188 36,175 Z",
    },
  ];

  return (
    <svg
      viewBox="0 0 120 200"
      className="w-full h-full max-h-[520px] select-none"
      style={{ filter: "drop-shadow(0px 6px 16px rgba(15, 23, 42, 0.04))" }}
    >
      <defs>
        {mapRecords.map((record) => {
          if (!record.coverImage) return null;
          return (
            <pattern
              key={`pattern-${record.region}`}
              id={`pattern-${record.region}`}
              patternUnits="userSpaceOnUse"
              width="100%"
              height="100%"
              viewBox="0 0 120 200"
            >
              <image
                href={record.coverImage}
                x="0"
                y="0"
                width="120"
                height="200"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          );
        })}
      </defs>

      <g
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {regions.map((region) => {
          const record = mapRecords.find((r) => r.region === region.name);
          const hasCover = record && record.coverImage;
          const isSelected = selectedRegion === region.name;

          return (
            <path
              key={region.id}
              d={region.d}
              onClick={() => onSelectRegion(isSelected ? null : region.name)}
              className="cursor-pointer transition-all duration-300"
              // 대표사진이 있으면 패턴을 입히고 없으면 기본 흰색 채움
              fill={
                hasCover
                  ? `url(#pattern-${region.name})`
                  : isSelected
                    ? "rgba(13, 148, 136, 0.15)"
                    : "#ffffff"
              }
              stroke={isSelected ? "#0d9488" : "#e2e8f0"}
              strokeWidth={isSelected ? "1.5" : "0.7"}
              style={{
                filter: isSelected
                  ? "drop-shadow(0px 0px 4px rgba(13, 148, 136, 0.3))"
                  : "none",
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
