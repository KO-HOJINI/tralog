require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 5000;

// 대용량 Base64 이미지 업로드를 위해 파싱 한도 확장
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// DB 연결 설정
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "tralog",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "tralog",
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL 연결 실패:", err);
    return;
  }
  console.log("✅ XAMPP MySQL 데이터베이스 연동 활성화 완료");
});

/** ==========================================
 * 1. 인증 (Auth) API
 * ========================================== */
app.post("/api/register", (req, res) => {
  const { id, password, name, birth, email } = req.body;
  const checkQuery = "SELECT id FROM users WHERE id = ?";
  db.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "DB 오류" });
    if (results.length > 0)
      return res.status(400).json({ message: "이미 사용 중인 아이디입니다." });

    const insertQuery =
      "INSERT INTO users (id, password, name, birth, email) VALUES (?, ?, ?, ?, ?)";
    db.query(insertQuery, [id, password, name, birth, email], (err) => {
      if (err) return res.status(500).json({ error: "회원가입 오류" });
      return res.status(201).json({ message: "회원가입 완료" });
    });
  });
});

app.post("/api/login", (req, res) => {
  const { id, password } = req.body;
  const loginQuery = "SELECT id, password, name FROM users WHERE id = ?";
  db.query(loginQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "DB 오류" });
    if (results.length === 0)
      return res
        .status(400)
        .json({ field: "id", message: "등록되지 않은 아이디입니다." });

    const user = results[0];
    if (user.password !== password)
      return res
        .status(400)
        .json({ field: "password", message: "비밀번호가 일치하지 않습니다." });

    return res.status(200).json({ id: user.id, name: user.name });
  });
});

/** ==========================================
 * 2. 일정(Schedules) 목록 및 상세 조회 API
 * ========================================== */

// 💡 날짜가 지난 일정을 자동으로 'completed' 처리하는 헬퍼 함수
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
        (SELECT si.image_data 
          FROM schedule_images si 
          JOIN schedules s2 ON si.schedule_id = s2.id 
          LEFT JOIN schedule_companions sc2 ON s2.id = sc2.schedule_id
          WHERE si.region = s.region 
            AND si.is_cover = TRUE 
            AND (s2.user_id = ? OR sc2.user_id = ?)
          LIMIT 1) as bgImage,
        (SELECT COUNT(*) FROM schedule_images si3 WHERE si3.schedule_id = s.id) as photo_count
      FROM schedules s
      LEFT JOIN schedule_companions sc ON s.id = sc.schedule_id
      WHERE (s.user_id = ? OR sc.user_id = ?) AND s.status = 'completed'
      ORDER BY s.end_date DESC
    `;
    db.query(query, [userId, userId, userId, userId], (err, results) => {
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
        (SELECT si.image_data 
          FROM schedule_images si 
          JOIN schedules s2 ON si.schedule_id = s2.id 
          LEFT JOIN schedule_companions sc2 ON s2.id = sc2.schedule_id
          WHERE si.region = s.region 
            AND si.is_cover = TRUE 
            AND (s2.user_id = ? OR sc2.user_id = ?)
          LIMIT 1) as bgImage,
        (SELECT COUNT(*) FROM schedule_images si3 WHERE si3.schedule_id = s.id) as photo_count
      FROM schedules s
      LEFT JOIN schedule_companions sc ON s.id = sc.schedule_id
      WHERE (s.user_id = ? OR sc.user_id = ?) AND s.status = 'planning'
      ORDER BY s.start_date ASC
    `;
    db.query(query, [userId, userId, userId, userId], (err, results) => {
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
    SELECT sc.user_id as id, u.name FROM schedule_companions sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.schedule_id = ?
  `;

  db.query(scheduleQuery, [scheduleId], (err, sMeta) => {
    if (err || sMeta.length === 0)
      return res.status(404).json({ message: "일정을 찾을 수 없습니다." });

    db.query(placesQuery, [scheduleId], (err, sPlaces) => {
      db.query(expensesQuery, [scheduleId], (err, sExpenses) => {
        db.query(companionsQuery, [scheduleId], (err, sCompanions) => {
          res
            .status(200)
            .json({
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
  const { title, start_date, end_date } = req.body;

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
// 네이버 장소 검색 API (중복 제거 및 최신 API로 통합)
app.get("/api/places/search", (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "검색어가 필요합니다." });

  const clientId =
    process.env.NAVER_MAP_API_KEY_ID || process.env.VITE_NAVER_MAP_CLIENT_ID;
  const clientSecret =
    process.env.NAVER_MAP_API_KEY || process.env.VITE_NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res
      .status(500)
      .json({ error: "네이버 지도 API 키가 설정되지 않았습니다." });
  }

  const options = {
    hostname: "map.ncloud-maps.com",
    path: `/map-search/v1/search?query=${encodeURIComponent(query)}&count=10`,
    method: "GET",
    headers: {
      "x-ncp-apigw-api-key-id": clientId,
      "x-ncp-apigw-api-key": clientSecret,
      Accept: "application/json",
    },
  };

  https
    .request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        try {
          const result = JSON.parse(data);
          if (result.errorMessage)
            return res
              .status(400)
              .json({ error: result.errorMessage, results: [] });

          const items = result.items || [];
          const places = items.map((item) => ({
            place_name: item.title || query,
            y: parseFloat(item.mapy),
            x: parseFloat(item.mapx),
            address: item.address || "",
            roadAddress: item.roadAddress || "",
          }));
          res.json({ results: places });
        } catch (err) {
          res.status(500).json({ error: "파싱 오류", results: [] });
        }
      });
    })
    .on("error", () =>
      res.status(500).json({ error: "API 호출 실패", results: [] }),
    )
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
  const { id, schedule_id, category, detail, amount } = req.body;
  const query =
    "INSERT INTO schedule_expenses (id, schedule_id, category, detail, amount) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [id, schedule_id, category, detail, amount], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "지출 등록 완료" });
  });
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
  const { schedule_id, target_id } = req.body;
  db.query("SELECT name FROM users WHERE id = ?", [target_id], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    if (users.length === 0)
      return res
        .status(404)
        .json({ message: "⚠️ 등록되지 않은 아이디입니다." });

    const query =
      "INSERT INTO schedule_companions (schedule_id, user_id) VALUES (?, ?)";
    db.query(query, [schedule_id, target_id], (err) => {
      if (err)
        return res
          .status(400)
          .json({ message: "⚠️ 이미 추가된 일행이거나 연동 오류입니다." });
      res.status(201).json({ name: users[0].name });
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
  const query = `
    SELECT si.region, si.image_data, si.is_cover FROM schedule_images si
    JOIN schedules s ON si.schedule_id = s.id
    LEFT JOIN schedule_companions sc ON s.id = sc.schedule_id
    WHERE s.user_id = ? OR sc.user_id = ?
  `;
  db.query(query, [userId, userId], (err, results) => {
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
      if (row.is_cover) mapDict[row.region].coverImage = row.image_data;
    });
    res.status(200).json(Object.values(mapDict));
  });
});

app.post("/api/map/upload", (req, res) => {
  const { schedule_id, region, image_data } = req.body;

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

  if (schedule_id.startsWith("direct-")) {
    db.query(
      "SELECT id FROM schedules WHERE id = ?",
      [schedule_id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        if (rows.length === 0) {
          db.query("SELECT id FROM users LIMIT 1", (uErr, uRows) => {
            const validUserId =
              uRows && uRows.length > 0 ? uRows[0].id : "admin";
            const dummyQuery =
              "INSERT INTO schedules (id, user_id, title, region, start_date, end_date, status) VALUES (?, ?, ?, ?, CURDATE(), CURDATE(), 'completed')";
            db.query(
              dummyQuery,
              [schedule_id, validUserId, `${region} 직접 기록`, region],
              (sErr) => {
                if (sErr)
                  return res.status(500).json({ error: "가상 일정 생성 실패" });
                insertImage();
              },
            );
          });
        } else {
          insertImage();
        }
      },
    );
  } else {
    insertImage();
  }
});

app.post("/api/map/cover", (req, res) => {
  const { schedule_id, region, image_data } = req.body;
  db.query(
    "UPDATE schedule_images SET is_cover = FALSE WHERE region = ? AND schedule_id = ?",
    [region, schedule_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.query(
        "UPDATE schedule_images SET is_cover = TRUE WHERE region = ? AND schedule_id = ? AND image_data = ?",
        [region, schedule_id, image_data],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.status(200).json({ message: "대표사진 설정 완료" });
        },
      );
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
