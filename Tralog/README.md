# Tralog

> 여행 일정을 짜고, 다녀온 곳을 **나만의 지도**에 추억으로 남기는 여행 기록 웹앱

크로스플랫폼프로그래밍2 수업 프로젝트로 만든 React 웹 애플리케이션입니다.
"여행 계획"과 "여행 기록"이 보통 따로 노는 게 아쉬워서, 일정 짜기부터 다녀온 후 사진/추억 정리까지 한 곳에서 할 수 있게 만들어 봤습니다.

---

## 주요 기능

### 1. 여행 일정 관리 (Schedule)
- 네이버 지도 API로 장소를 검색해서 타임라인에 추가
- 날짜별로 동선을 정리하는 타임라인 뷰
- **가계부**: 여행 중 지출을 항목별로 기록
- **일행 관리**: 같이 가는 사람들 추가/관리
- 대표 사진 업로드

### 2. 나만의 지도 (My Map)
- `d3-geo`로 직접 그린 대한민국 SVG 지도
- 다녀온 지역을 클릭하면 그 지역에 **대표 사진이 배경으로 채워짐**
- 제주도는 좌표 범위가 달라서 인셋(inset) 방식으로 따로 배치
- 울릉도/독도는 실제 좌표가 너무 동쪽이라 동해안 가까이 당겨서 표시
- 지역별 사진 갤러리 + 추억 기록

### 3. 대시보드 (Dashboard)
- 내 지도 현황 + 여행 일정 목록을 한눈에
- 새 일정 만들기

### 4. 로그인 / 회원가입
- localStorage 기반 세션 관리
- 백엔드 API와 연동 (회원가입/로그인)

---

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite |
| 스타일링 | Tailwind CSS v4 + daisyUI |
| 애니메이션 | Framer Motion |
| 지도 | d3-geo (대한민국 지도), Naver Maps API (장소 검색) |
| 상태 관리 | React Hooks (별도 라이브러리 없이 `useState` / 커스텀 훅) |

> 라우팅 라이브러리(React Router)를 쓰지 않고 `useState` + History API로 직접 페이지 전환을 구현했습니다.
> 브라우저 뒤로가기 버튼도 동작하도록 `pushState` / `popstate`를 연동했습니다.

---

## 폴더 구조

```
src/
├── App.tsx                  # 루트 컴포넌트 (페이지 전환 + History API)
├── main.tsx                 # 진입점
├── config/
│   └── api.ts               # API 주소 / 네이버 지도 키 (환경변수)
├── styles/                  # 전역 스타일
└── components/
    ├── Navbar.tsx
    ├── content/
    │   └── korea-provinces.json   # 대한민국 행정구역 GeoJSON
    └── pages/
        ├── auth/            # 로그인 / 회원가입
        ├── dashboard/       # 대시보드 (지도 요약 + 일정 목록)
        ├── mymap/           # 나만의 지도 (지도 + 사진 갤러리)
        │   └── hooks/       # useMapHistory, usePhotoActions
        └── schedule/        # 일정 편집 (타임라인 / 가계부 / 일행)
            ├── account/     # 가계부
            ├── timeline/    # 타임라인 + 장소 검색
            ├── header/      # 일정 헤더 / 사진 업로드
            └── hooks/       # useSchedule, useNaverMap, useCompanion
```

데이터 로직은 최대한 커스텀 훅(`hooks/`)으로 분리해서 컴포넌트는 UI에 집중하도록 했습니다.

---

## 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env.example`을 복사해서 `.env`를 만들고, 값을 채워주세요.

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=백엔드_API_주소
VITE_NAVER_MAP_CLIENT_ID=네이버_지도_클라이언트_ID
```

> `.env`가 없어도 빌드는 되지만, 로그인/장소 검색 같은 기능은 동작하지 않습니다.
> 실제 키가 든 `.env`는 `.gitignore`에 등록되어 있어 커밋되지 않습니다. (공유는 `.env.example`로만)

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 빌드
```bash
npm run build      # 타입 체크(tsc) 후 빌드
npm run preview    # 빌드 결과 미리보기
```

---

## AI 도움을 받은 부분

수업 프로젝트인 만큼, 직접 구현하기 어려웠던 부분은 AI 도움을 받았고 해당 코드에는 주석으로 표시해 두었습니다.

- `d3-geo`의 `geoMercator` 투영기 설정값(center / scale / translate) 계산
- 제주도 인셋 지도 구현 방식
- SVG `<pattern>`으로 지역 도형에 이미지를 채우는 방법
- History API(`pushState` / `popstate`)로 브라우저 뒤로가기 동기화

---

## 회고 / 아쉬운 점

- 라우터를 안 쓰고 직접 페이지 전환을 구현하다 보니, 페이지가 늘어날수록 `App.tsx`의 `switch` 문이 길어졌다. 다음엔 React Router를 써보고 싶다.
- 지도에서 울릉도/독도 같은 작은 섬 위치를 맞추는 게 생각보다 까다로웠다. (실제 좌표 그대로 그리면 화면 밖으로 나가버림)
- 상태를 localStorage로 관리하는 부분이 많아서, 나중에 전역 상태 관리 라이브러리를 도입하면 더 깔끔할 것 같다.

---

*2026학년도 1학기 · 크로스플랫폼프로그래밍2 프로젝트*
