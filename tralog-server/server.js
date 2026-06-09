// server.js - Tralog 백엔드 서버 (Express + MySQL)
// 인증, 일정, 장소/가계부/일행, 이미지 갤러리 API 제공
// 네이버 지역 검색 API 프록시도 여기서 처리

require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const https = require("https");
const bcrypt = require("bcrypt");

// bcrypt 해싱 강도 (cost factor) - 높을수록 안전하지만 느려짐
const SALT_ROUNDS = 10;

const app = express();
const PORT = process.env.PORT || 5000;

// 대용량 Base64 이미지 업로드를 위해 파싱 한도 확장
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// DB 연결 설정
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "tralog",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "tralog",
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL 연결 실패:", err);
    return;
  }
  console.log("✅ MySQL 데이터베이스 연동 활성화 완료");
});

/** ==========================================
 * 1. 인증 (Auth) API
 * ========================================== */
app.post("/api/register", (req, res) => {
  const { id, password, name, birth, email } = req.body;

  // 서버 측 유효성 검사 (DB 컬럼 길이/형식 위반 시 친절한 메시지 반환)
  if (!id || !password || !name || !birth || !email)
    return res
      .status(400)
      .json({ message: "필수 입력 항목이 누락되었습니다." });
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(id))
    return res
      .status(400)
      .json({ message: "아이디는 영문/숫자/_ 4~20자여야 합니다." });
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 20
  )
    return res.status(400).json({ message: "비밀번호는 8~20자여야 합니다." });
  if (typeof name !== "string" || name.trim().length < 1 || name.length > 50)
    return res.status(400).json({ message: "이름이 올바르지 않습니다." });
  if (!/^\d{6}$/.test(birth))
    return res
      .status(400)
      .json({ message: "생년월일은 6자리 숫자여야 합니다." });
  if (
    typeof email !== "string" ||
    email.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    return res
      .status(400)
      .json({ message: "이메일 형식이 올바르지 않습니다." });

  const checkQuery = "SELECT id FROM users WHERE id = ?";
  db.query(checkQuery, [id], async (err, results) => {
    if (err) return res.status(500).json({ error: "DB 오류" });
    if (results.length > 0)
      return res.status(400).json({ message: "이미 사용 중인 아이디입니다." });

    // 비밀번호를 평문이 아닌 bcrypt 해시로 저장 (DB 유출 시 원본 보호)
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    } catch (hashErr) {
      console.error("비밀번호 해싱 오류:", hashErr);
      return res.status(500).json({ error: "회원가입 오류" });
    }

    const insertQuery =
      "INSERT INTO users (id, password, name, birth, email) VALUES (?, ?, ?, ?, ?)";
    db.query(insertQuery, [id, hashedPassword, name, birth, email], (err) => {
      if (err) return res.status(500).json({ error: "회원가입 오류" });
      return res.status(201).json({ message: "회원가입 완료" });
    });
  });
});

app.post("/api/login", (req, res) => {
  const { id, password } = req.body;
  const loginQuery = "SELECT id, password, name FROM users WHERE id = ?";
  db.query(loginQuery, [id], async (err, results) => {
    if (err) return res.status(500).json({ error: "DB 오류" });
    if (results.length === 0)
      return res
        .status(400)
        .json({ field: "id", message: "등록되지 않은 아이디입니다." });

    const user = results[0];

    // 저장된 값이 bcrypt 해시($2로 시작)면 해시 비교, 아니면 기존 평문 계정으로 간주
    const isHashed = typeof user.password === "string" && user.password.startsWith("$2");

    let isMatch;
    try {
      isMatch = isHashed
        ? await bcrypt.compare(password, user.password)
        : password === user.password;
    } catch (compareErr) {
      console.error("비밀번호 비교 오류:", compareErr);
      return res.status(500).json({ error: "DB 오류" });
    }

    if (!isMatch)
      return res
        .status(400)
        .json({ field: "password", message: "비밀번호가 일치하지 않습니다." });

    // 기존 평문 계정은 로그인 성공 시 해시로 자동 업그레이드 (마이그레이션)
    if (!isHashed) {
      try {
        const newHash = await bcrypt.hash(password, SALT_ROUNDS);
        db.query("UPDATE users SET password = ? WHERE id = ?", [newHash, id], (updateErr) => {
          if (updateErr) console.error("비밀번호 해시 마이그레이션 실패:", updateErr);
        });
      } catch (hashErr) {
        console.error("비밀번호 해시 마이그레이션 오류:", hashErr);
      }
    }

    return res.status(200).json({ id: user.id, name: user.name });
  });
});

/** ==========================================
 * 2. 일정(Schedules) 목록 및 상세 조회 API
 * ========================================== */

// 날짜가 지난 일정을 자동으로 'completed' 처리하는 헬퍼
const autoCompleteSchedules = (callback) => {
  const updateQuery =
    "UPDATE schedules SET status = 'completed' WHERE end_date < CURDATE() AND status = 'planning'";
  db.query(updateQuery, (err) => {
    if (err) console.error("⚠️ 지난 일정 자동 완료 업데이트 실패:", err);
    callback(); // 업데이트 완료 후 기존 조회 로직 실행
  });
};

// 완료된 일정 리스트 (해당 지역의 대표 사진 및 업로드된 사진 개수 포함)
app.get("/api/schedules/history/:userId", (req, res) => {
  autoCompleteSchedules(() => {
    const userId = req.params.userId;
    const query = `
      SELECT DISTINCT s.*,
        (SELECT umc.image_data
          FROM user_map_covers umc
          WHERE umc.user_id = ? AND umc.region = s.region
          LIMIT 1) as bgImage,
        (SELECT COUNT(*) FROM schedule_images si3 WHERE si3.schedule_id = s.id) as photo_count
      FROM schedules s
      LEFT JOIN schedule_companions sc ON s.id = sc.schedule_id
      WHERE (s.user_id = ? OR sc.user_id = ?) AND s.status = 'completed'
      ORDER BY s.end_date DESC
    `;
    db.query(query, [userId, userId, userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  });
});

// 진행 중인 일정 리스트 (해당 지역의 대표 사진 및 업로드된 사진 개수 포함)
app.get("/api/schedules/active/:userId", (req, res) => {
  autoCompleteSchedules(() => {
    const userId = req.params.userId;
    const query = `
      SELECT DISTINCT s.*,
        (SELECT umc.image_data
          FROM user_map_covers umc
          WHERE umc.user_id = ? AND umc.region = s.region
          LIMIT 1) as bgImage,
        (SELECT COUNT(*) FROM schedule_images si3 WHERE si3.schedule_id = s.id) as photo_count
      FROM schedules s
      LEFT JOIN schedule_companions sc ON s.id = sc.schedule_id
      WHERE (s.user_id = ? OR sc.user_id = ?) AND s.status = 'planning'
      ORDER BY s.start_date ASC
    `;
    db.query(query, [userId, userId, userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  });
});

// 단일 일정 종합 데이터 조회
app.get("/api/schedules/:scheduleId", (req, res) => {
  const scheduleId = req.params.scheduleId;
  const scheduleQuery = "SELECT * FROM schedules WHERE id = ?";
  const placesQuery =
    "SELECT * FROM schedule_places WHERE schedule_id = ? ORDER BY day_number, visit_time";
  const expensesQuery = "SELECT * FROM schedule_expenses WHERE schedule_id = ?";

  const companionsQuery = `
    SELECT sc.user_id as id, u.name, sc.role 
    FROM schedule_companions sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.schedule_id = ?
  `;

  db.query(scheduleQuery, [scheduleId], (err, sMeta) => {
    if (err || sMeta.length === 0)
      return res.status(404).json({ message: "일정을 찾을 수 없습니다." });

    db.query(placesQuery, [scheduleId], (err, sPlaces) => {
      db.query(expensesQuery, [scheduleId], (err, sExpenses) => {
        db.query(companionsQuery, [scheduleId], (err, sCompanions) => {
          res.status(200).json({
            meta: sMeta[0],
            places: sPlaces,
            expenses: sExpenses,
            companions: sCompanions,
          });
        });
      });
    });
  });
});

// 새 일정 생성
app.post("/api/schedules", (req, res) => {
  const { user_id, title, region, start_date, end_date, status } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id가 필요합니다." });

  const scheduleId = `s-${Date.now()}`;
  const insertQuery =
    "INSERT INTO schedules (id, user_id, title, region, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)";

  db.query(
    insertQuery,
    [
      scheduleId,
      user_id,
      title || "새 일정",
      region || "서울특별시",
      start_date,
      end_date,
      status || "planning",
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: scheduleId });
    },
  );
});

// 일정 메타 정보 수정
app.put("/api/schedules/:scheduleId", (req, res) => {
  const scheduleId = req.params.scheduleId;
  const { title, start_date, end_date, region } = req.body;

  const updateFields = [];
  const values = [];

  if (title !== undefined) {
    updateFields.push("title = ?");
    values.push(title);
  }
  if (start_date !== undefined) {
    updateFields.push("start_date = ?");
    values.push(start_date);
  }
  if (end_date !== undefined) {
    updateFields.push("end_date = ?");
    values.push(end_date);
  }
  if (region !== undefined) {
    updateFields.push("region = ?");
    values.push(region);
  }

  if (updateFields.length === 0)
    return res.status(400).json({ error: "변경할 필드가 없습니다." });

  values.push(scheduleId);
  const query = `UPDATE schedules SET ${updateFields.join(", ")} WHERE id = ?`;
  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "일정을 찾을 수 없습니다." });
    res.status(200).json({ message: "일정이 업데이트되었습니다." });
  });
});

// 일정 전체 삭제 (CASCADE 연동)
app.delete("/api/schedules/:scheduleId", (req, res) => {
  const scheduleId = req.params.scheduleId;
  db.query(
    "DELETE FROM schedules WHERE id = ?",
    [scheduleId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
      res.status(200).json({ message: "일정이 삭제되었습니다." });
    },
  );
});

/** ==========================================
 * 3. 세부 항목 편집 (장소/가계부/동행인) API
 * ========================================== */

// 네이버 장소 검색 API (네이버 Developers 지역 검색 API 연동)
app.get("/api/places/search", (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "검색어가 필요합니다." });

  const clientId =
    process.env.NAVER_SEARCH_CLIENT_ID || process.env.VITE_NAVER_MAP_CLIENT_ID;
  const clientSecret =
    process.env.NAVER_SEARCH_CLIENT_SECRET ||
    process.env.VITE_NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res
      .status(500)
      .json({ error: "네이버 API 키가 설정되지 않았습니다." });
  }

  const options = {
    hostname: "openapi.naver.com",
    // display=15로 설정해 검색 결과를 넉넉하게 받음
    path: `/v1/search/local.json?query=${encodeURIComponent(query)}&display=15`,
    method: "GET",
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  };

  https
    .request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        try {
          const result = JSON.parse(data);

          if (result.errorCode) {
            console.error("네이버 검색 API 에러:", result);
            return res
              .status(response.statusCode)
              .json({ error: result.errorMessage, results: [] });
          }

          const items = result.items || [];
          const places = items.map((item) => {
            let x = parseFloat(item.mapx);
            let y = parseFloat(item.mapy);
            if (x > 1000) x = x / 10000000;
            if (y > 1000) y = y / 10000000;

            return {
              place_name: item.title.replace(/<[^>]*>?/gm, ""),
              y: y,
              x: x,
              address: item.address || "",
              roadAddress: item.roadAddress || "",
            };
          });

          res.json({ results: places });
        } catch (err) {
          res.status(500).json({ error: "데이터 파싱 오류", results: [] });
        }
      });
    })
    .on("error", (err) => {
      res.status(500).json({ error: "네이버 API 호출 통신 실패", results: [] });
    })
    .end();
});

app.post("/api/places", (req, res) => {
  const { id, schedule_id, day_number, visit_time, place_name, lat, lng } =
    req.body;
  const query =
    "INSERT INTO schedule_places (id, schedule_id, day_number, visit_time, place_name, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [
      id,
      schedule_id,
      day_number,
      visit_time,
      place_name,
      lat || null,
      lng || null,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "동선 추가 완료" });
    },
  );
});

app.put("/api/places/:id", (req, res) => {
  const { memo } = req.body;
  db.query(
    "UPDATE schedule_places SET memo = ? WHERE id = ?",
    [memo, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: "메모가 업데이트되었습니다." });
    },
  );
});

app.delete("/api/places/:id", (req, res) => {
  db.query(
    "DELETE FROM schedule_places WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: "동선 삭제 완료" });
    },
  );
});

app.post("/api/expenses", (req, res) => {
  const { id, schedule_id, category, detail, amount, day_number } = req.body;
  const query =
    "INSERT INTO schedule_expenses (id, schedule_id, category, detail, amount, day_number) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [id, schedule_id, category, detail, amount, day_number ?? null],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "지출 등록 완료" });
    },
  );
});

app.delete("/api/expenses/:id", (req, res) => {
  db.query(
    "DELETE FROM schedule_expenses WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: "지출 내역 삭제 완료" });
    },
  );
});

app.post("/api/companions", (req, res) => {
  const { schedule_id, target_id, role } = req.body;
  db.query("SELECT name FROM users WHERE id = ?", [target_id], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    if (users.length === 0)
      return res
        .status(404)
        .json({ message: "⚠️ 등록되지 않은 아이디입니다." });

    const query =
      "INSERT INTO schedule_companions (schedule_id, user_id, role) VALUES (?, ?, ?)";
    db.query(query, [schedule_id, target_id, role || "read"], (err) => {
      if (err)
        return res
          .status(400)
          .json({ message: "⚠️ 이미 추가된 일행이거나 연동 오류입니다." });

      res
        .status(201)
        .json({ id: target_id, name: users[0].name, role: role || "read" });
    });
  });
});

app.delete("/api/companions/:scheduleId/:userId", (req, res) => {
  const { scheduleId, userId } = req.params;
  db.query(
    "DELETE FROM schedule_companions WHERE schedule_id = ? AND user_id = ?",
    [scheduleId, userId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: "일행 제외 성공" });
    },
  );
});

/** ==========================================
 * 4. 이미지 갤러리 및 대표사진(Cover) API
 * ========================================== */
app.get("/api/map/records/:userId", (req, res) => {
  const userId = req.params.userId;
  // 갤러리 사진은 본인 일정 + 일행으로 참여한 일정까지 모두 조회 (공유 O)
  // 동행자(companion)를 LEFT JOIN하면 동행자 수만큼 사진이 중복 조회되므로
  // (카테시안 곱), 일행 참여 여부는 EXISTS 서브쿼리로 판별해 행 복제를 막는다.
  const galleryQuery = `
    SELECT si.region, si.image_data FROM schedule_images si
    JOIN schedules s ON si.schedule_id = s.id
    WHERE s.user_id = ?
      OR EXISTS (
        SELECT 1 FROM schedule_companions sc
        WHERE sc.schedule_id = s.id AND sc.user_id = ?
      )
  `;
  db.query(galleryQuery, [userId, userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const mapDict = {};
    results.forEach((row) => {
      if (!mapDict[row.region]) {
        mapDict[row.region] = {
          region: row.region,
          images: [],
          coverImage: "",
        };
      }
      mapDict[row.region].images.push(row.image_data);
    });

    // 대표사진은 유저별 저장 (일행과 공유 X)
    db.query(
      "SELECT region, image_data FROM user_map_covers WHERE user_id = ?",
      [userId],
      (coverErr, covers) => {
        if (coverErr) return res.status(500).json({ error: coverErr.message });

        covers.forEach((c) => {
          const record = mapDict[c.region];
          // 갤러리에 남아있는 사진만 대표사진으로 반영 (삭제된 사진 방지)
          if (record && record.images.includes(c.image_data)) {
            record.coverImage = c.image_data;
          }
        });
        res.status(200).json(Object.values(mapDict));
      },
    );
  });
});

app.post("/api/map/upload", (req, res) => {
  const { schedule_id, region, image_data, user_id } = req.body;

  const insertImage = () => {
    const query =
      "INSERT INTO schedule_images (schedule_id, region, image_data) VALUES (?, ?, ?)";
    db.query(query, [schedule_id, region, image_data], (err) => {
      if (err)
        return res
          .status(500)
          .json({ error: "이미지 저장 실패: " + err.message });
      res.status(201).json({ message: "사진 업로드 완료" });
    });
  };

  // 마이맵 개인 업로드(direct-)는 업로드한 유저 소유의 더미 일정으로 저장해야
  // 일행에게 공유되지 않는다. (소유자가 잘못되면 그 유저의 일행에게 누수됨)
  const createDummySchedule = (ownerId) => {
    const dummyQuery =
      "INSERT INTO schedules (id, user_id, title, region, start_date, end_date, status) VALUES (?, ?, ?, ?, CURDATE(), CURDATE(), 'completed')";
    db.query(
      dummyQuery,
      [schedule_id, ownerId, `${region} 직접 기록`, region],
      (sErr) => {
        if (sErr) return res.status(500).json({ error: "가상 일정 생성 실패" });
        insertImage();
      },
    );
  };

  if (schedule_id.startsWith("direct-")) {
    db.query(
      "SELECT id FROM schedules WHERE id = ?",
      [schedule_id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        if (rows.length > 0) {
          insertImage();
        } else if (user_id) {
          createDummySchedule(user_id);
        } else {
          // user_id 누락 시 폴백 (구버전 호환)
          db.query("SELECT id FROM users LIMIT 1", (uErr, uRows) => {
            const validUserId =
              uRows && uRows.length > 0 ? uRows[0].id : "admin";
            createDummySchedule(validUserId);
          });
        }
      },
    );
  } else {
    insertImage();
  }
});

app.post("/api/map/cover", (req, res) => {
  // 대표사진은 유저별로 지역마다 하나씩 저장 (일행과 공유 안 함)
  const { user_id, region, image_data } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id가 필요합니다." });
  db.query(
    `INSERT INTO user_map_covers (user_id, region, image_data) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE image_data = VALUES(image_data)`,
    [user_id, region, image_data],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: "대표사진 설정 완료" });
    },
  );
});

app.delete("/api/map/photo", (req, res) => {
  const { schedule_id, region, image_data } = req.body;
  const query =
    "DELETE FROM schedule_images WHERE schedule_id = ? AND region = ? AND image_data = ?";
  db.query(query, [schedule_id, region, image_data], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "사진 삭제 완료" });
  });
});

app.listen(PORT, () =>
  console.log(`🚀 Tralog Core Server 가동 포트 :: ${PORT}`),
);
