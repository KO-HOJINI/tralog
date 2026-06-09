-- ===================================================
-- TRALOG 프로젝트 통합 데이터베이스 스키마
-- ===================================================

-- 1. 회원 정보 테이블
CREATE TABLE IF NOT EXISTS users (
    id         VARCHAR(50)  PRIMARY KEY,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(50)  NOT NULL,
    birth      CHAR(6)      NOT NULL,
    email      VARCHAR(100) NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 2. 메인 여행 일정 테이블 (목록 및 메타데이터 정보)
CREATE TABLE IF NOT EXISTS schedules (
    id         VARCHAR(50)  PRIMARY KEY,
    user_id    VARCHAR(50)  NOT NULL, -- 생성자 ID
    title      VARCHAR(100) NOT NULL,
    region     VARCHAR(50)  NOT NULL, -- 예: '제주특별자치도', '서울특별시' (마이맵 매핑용)
    start_date DATE         NOT NULL,
    end_date   DATE         NOT NULL,
    status     VARCHAR(20)  DEFAULT 'completed', -- 'planning' 또는 'completed' (끝난 일정 판별)
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. 일정 동행 멤버 테이블 (다른 계정 초대 공유용)
CREATE TABLE IF NOT EXISTS schedule_companions (
    schedule_id VARCHAR(50) NOT NULL,
    user_id     VARCHAR(50) NOT NULL, -- 초대받은 유저 ID
    role        VARCHAR(20) DEFAULT 'read', -- 'read'(읽기 전용) 또는 'edit'(편집 가능)
    PRIMARY KEY (schedule_id, user_id),
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
);

-- 4. 타임라인 및 동선 장소 테이블 (TimelineSection & PlaceItemCard용)
CREATE TABLE IF NOT EXISTS schedule_places (
    id             VARCHAR(50)    PRIMARY KEY,
    schedule_id    VARCHAR(50)    NOT NULL,
    day_number     INT            NOT NULL DEFAULT 1, -- 1일차, 2일차 등
    visit_time     CHAR(5)        NOT NULL,           -- '09:00'
    place_name     VARCHAR(100)   NOT NULL,
    lat            DECIMAL(10, 7) NULL,               -- 위도
    lng            DECIMAL(10, 7) NULL,               -- 경도
    memo           TEXT           NULL,
    sequence_order INT            NOT NULL DEFAULT 0, -- 정렬 순서
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- 5. 가계부 지출 테이블 (AccountBookSection용)
CREATE TABLE IF NOT EXISTS schedule_expenses (
    id          VARCHAR(50) PRIMARY KEY,
    schedule_id VARCHAR(50) NOT NULL,
    category    VARCHAR(20) NOT NULL, -- '식비', '숙소', '교통', '기타'
    detail      VARCHAR(150) NOT NULL,
    amount      INT         NOT NULL DEFAULT 0,
    day_number  INT         NULL,     -- 가계부 일차별 분류 (NULL = 미지정)
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- 6. 지역별/일정별 사진 업로드 테이블 (PhotoGrid & InteractiveMap용)
-- ※ 사진(갤러리)은 일행과 공유되지만, 대표사진은 user_map_covers에서 유저별로 따로 관리합니다.
CREATE TABLE IF NOT EXISTS schedule_images (
    id          INT          AUTO_INCREMENT PRIMARY KEY,
    schedule_id VARCHAR(50)  NOT NULL,
    region      VARCHAR(50)  NOT NULL, -- '제주특별자치도' 등
    image_data  LONGTEXT     NOT NULL, -- Base64 인코딩 데이터 스트링
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- 7. 유저별 지역 대표사진 테이블 (인터랙티브맵 배경 / 일정 카드 썸네일용)
-- 갤러리(schedule_images)는 일행끼리 공유되지만, 대표사진은 일행과 공유되지 않고
-- 각 유저가 지역별로 자신의 대표사진을 따로 지정합니다.
CREATE TABLE IF NOT EXISTS user_map_covers (
    user_id    VARCHAR(50) NOT NULL,
    region     VARCHAR(50) NOT NULL, -- '제주특별자치도' 등
    image_data LONGTEXT    NOT NULL, -- 대표로 지정한 사진의 Base64 데이터
    PRIMARY KEY (user_id, region),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);