-- 회원 정보 테이블
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    birth CHAR(6) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 메인 여행 일정 테이블 (MyMapHistory 목록 및 메타데이터 정보)
CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL, -- 생성자 ID
    title VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,   -- 예: '제주특별자치도', '서울특별시' (마이맵 매핑용)
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'completed', -- 'planning' 또는 'completed' (끝난 일정 판별)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 일정 동행 멤버 테이블 (다른 계정 초대 공유용)
CREATE TABLE IF NOT EXISTS schedule_companions (
    schedule_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL, -- 초대받은 유저 ID
    PRIMARY KEY (schedule_id, user_id),
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 타임라인 및 동선 장소 테이블 (TimelineSection & PlaceItemCard용)
CREATE TABLE IF NOT EXISTS schedule_places (
    id VARCHAR(50) PRIMARY KEY,
    schedule_id VARCHAR(50) NOT NULL,
    day_number INT NOT NULL DEFAULT 1, -- 1일차, 2일차 등
    visit_time CHAR(5) NOT NULL,       -- '09:00'
    place_name VARCHAR(100) NOT NULL,
    memo TEXT NULL,
    sequence_order INT NOT NULL DEFAULT 0, -- 정렬 순서
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- 4. 가계부 지출 테이블 (AccountBookSection용)
CREATE TABLE IF NOT EXISTS schedule_expenses (
    id VARCHAR(50) PRIMARY KEY,
    schedule_id VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL, -- '식비', '숙소', '교통', '기타'
    detail VARCHAR(150) NOT NULL,
    amount INT NOT NULL DEFAULT 0,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- 5. 지역별/일정별 사진 업로드 및 대표사진 관리 테이블 (PhotoGrid & InteractiveMap용)
CREATE TABLE IF NOT EXISTS schedule_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,   -- '제주특별자치도' 등
    image_data LONGTEXT NOT NULL,  -- Base64 인코딩 데이터 스트링
    is_cover BOOLEAN DEFAULT FALSE, -- 대표사진 여부 (인터랙티브맵 배경 가동용)
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

ALTER TABLE schedule_places
  ADD COLUMN lat DECIMAL(10, 7) NULL AFTER place_name,
  ADD COLUMN lng DECIMAL(10, 7) NULL AFTER lat;

-- 더미 데이터
-- 예정된 일정 3개 (status: 'planning')
INSERT INTO schedules (id, user_id, title, region, start_date, end_date, status) VALUES
('s-1', 'admin', '에메랄드빛 제주 바다 여행', '제주특별자치도', '2026-06-15', '2026-06-18', 'planning'),
('s-2', 'admin', '고즈넉한 경주 야경 산책', '경상북도', '2026-09-04', '2026-09-06', 'planning'),
('s-3', 'admin', '부산 광안리 해변과 식도락 투어', '부산광역시', '2026-10-10', '2026-10-12', 'planning');

-- 완료된 지난 일정 2개 (status: 'completed')
INSERT INTO schedules (id, user_id, title, region, start_date, end_date, status) VALUES
('h-1', 'admin', '강릉 안목해변 커피거리 휴가', '강원특별자치도', '2025-11-20', '2025-11-22', 'completed'),
('h-2', 'admin', '서울 도심 야경 투어', '서울특별시', '2025-12-24', '2025-12-26', 'completed');