-- 장비-브로커/토픽
CREATE TABLE IF NOT EXISTS device_endpoint (
  device_id   VARCHAR(100) PRIMARY KEY,
  host        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB//

-- 장비별 슬롯 메타
CREATE TABLE IF NOT EXISTS device_slot (
  device_id    VARCHAR(100) NOT NULL,
  slot_id      BIGINT NOT NULL,
  name         VARCHAR(100) NULL,
  max_capacity INT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (device_id, slot_id),
  CONSTRAINT device_slot_fk_device
    FOREIGN KEY (device_id) REFERENCES device_endpoint(device_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB//

-- 슬롯-노트 매핑(장비 범위)
CREATE TABLE IF NOT EXISTS device_slot_note (
  device_id  VARCHAR(100) NOT NULL,
  slot_id    BIGINT NOT NULL,
  note_id    BIGINT NOT NULL,
  note_name  VARCHAR(100) NULL,
  PRIMARY KEY (device_id, slot_id),
  UNIQUE KEY uq_slotnote_device_note (device_id, note_id),
  CONSTRAINT device_slot_note_fk_slot
    FOREIGN KEY (device_id, slot_id) REFERENCES device_slot(device_id, slot_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB//

-- 현재 재고(슬롯 단위)
CREATE TABLE IF NOT EXISTS device_stock (
  device_id   VARCHAR(100) NOT NULL,
  slot_id     BIGINT NOT NULL,
  amount      INT NOT NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (device_id, slot_id),
  CONSTRAINT device_stock_fk_slot
    FOREIGN KEY (device_id, slot_id) REFERENCES device_slot(device_id, slot_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB//

-- 노트 누적 재고(장비 전체)
CREATE TABLE IF NOT EXISTS device_note_inventory (
  device_id    VARCHAR(100) NOT NULL,
  note_id      BIGINT NOT NULL,
  amount INT NOT NULL,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (device_id, note_id),
  CONSTRAINT device_note_inventory_fk_device
    FOREIGN KEY (device_id) REFERENCES device_endpoint(device_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB//

-- 장부(감사 로그)
CREATE TABLE IF NOT EXISTS device_note_ledger (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id  VARCHAR(100) NOT NULL,
  note_id    BIGINT NOT NULL,
  slot_id    BIGINT NULL,
  delta      INT NOT NULL,            -- +주입 / -소모
  reason     VARCHAR(100) NOT NULL,   -- update-fill / manufacture-consume 등
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT device_note_ledger_fk_device
    FOREIGN KEY (device_id) REFERENCES device_endpoint(device_id)
    ON DELETE CASCADE ON UPDATE CASCADE
  -- 필요하면 아래 복합 FK 활성화
  -- , CONSTRAINT device_note_ledger_fk_slot
  --   FOREIGN KEY (device_id, slot_id) REFERENCES device_slot(device_id, slot_id)
  --   ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB//

-- 제조 헤더/레시피/로그
CREATE TABLE IF NOT EXISTS mf_job (
  job_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id  VARCHAR(100) NOT NULL,
  status     VARCHAR(20)  NOT NULL,  -- CREATED/PREPARE/PROGRESS/COMPLETED/FAILED/CANCELLED
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT mf_job_fk_device
    FOREIGN KEY (device_id) REFERENCES device_endpoint(device_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB//

CREATE TABLE IF NOT EXISTS mf_recipe (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  job_id        BIGINT NOT NULL,
  slot_id       BIGINT NOT NULL,
  ingredient_id BIGINT NULL,
  name          VARCHAR(100) NULL,
  prop          INT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mf_recipe_fk_job
    FOREIGN KEY (job_id) REFERENCES mf_job(job_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB//

CREATE TABLE IF NOT EXISTS mf_log (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id  VARCHAR(100) NOT NULL,
  job_id     BIGINT NULL,
  cmd        VARCHAR(50)  NOT NULL,   -- manufacture/update/check
  event      VARCHAR(50)  NOT NULL,   -- request/possible/progress/completed/error/snapshot/ack
  detail     VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mf_log_fk_device
    FOREIGN KEY (device_id) REFERENCES device_endpoint(device_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT mf_log_fk_job
    FOREIGN KEY (job_id) REFERENCES mf_job(job_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB//

-- 인덱스(존재 체크 후 생성) - mf_job
SET @stmt := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name  = 'mf_job'
              AND index_name  = 'idx_job_device_status'),
    'DO 0',
    'CREATE INDEX idx_job_device_status ON mf_job(device_id, status, job_id)'
  )
)//
PREPARE s FROM @stmt//
EXECUTE s//
DEALLOCATE PREPARE s//

-- 인덱스(존재 체크 후 생성) - mf_log
SET @stmt := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name  = 'mf_log'
              AND index_name  = 'idx_log_device_time'),
    'DO 0',
    'CREATE INDEX idx_log_device_time ON mf_log(device_id, created_at)'
  )
)//
PREPARE s FROM @stmt//
EXECUTE s//
DEALLOCATE PREPARE s//

-- 인덱스(존재 체크 후 생성) - mf_recipe
SET @stmt := (
  SELECT IF(
    EXISTS (SELECT 1 FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name  = 'mf_recipe'
              AND index_name  = 'idx_recipe_job'),
    'DO 0',
    'CREATE INDEX idx_recipe_job ON mf_recipe(job_id)'
  )
)//
PREPARE s FROM @stmt//
EXECUTE s//
DEALLOCATE PREPARE s//

DROP PROCEDURE IF EXISTS upsert_slot_mapping//
CREATE PROCEDURE upsert_slot_mapping(
    IN p_device_id VARCHAR(100),
    IN p_slot_id   BIGINT,
    IN p_note_id   BIGINT,
    IN p_note_name VARCHAR(100)
)
BEGIN
  -- (1) endpoint 보장 (host NOT NULL → placeholder 사용)
  INSERT INTO device_endpoint (device_id, host)
  VALUES (p_device_id, 'mqtt://placeholder')
  ON DUPLICATE KEY UPDATE device_id = device_id;

  -- (2) slot 보장
  INSERT INTO device_slot (device_id, slot_id, name)
  VALUES (p_device_id, p_slot_id, CONCAT('slot-', p_slot_id))
  ON DUPLICATE KEY UPDATE device_id = device_id;

  -- (3) slot-note upsert
  INSERT INTO device_slot_note (device_id, slot_id, note_id, note_name)
  VALUES (p_device_id, p_slot_id, p_note_id, p_note_name)
  ON DUPLICATE KEY UPDATE
      note_id   = VALUES(note_id),
      note_name = VALUES(note_name);
END//
