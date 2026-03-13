-- key 컬럼/타입은 환경에 맞게 조정
CREATE TABLE recipe (id BIGINT PRIMARY KEY AUTO_INCREMENT, recipe_key VARCHAR(255) UNIQUE, created_at TIMESTAMP);
CREATE TABLE recipe_item (id BIGINT PRIMARY KEY AUTO_INCREMENT, recipe_id BIGINT, note_id BIGINT, prop INT);

CREATE TABLE inventory (note_id BIGINT PRIMARY KEY, qty BIGINT);
CREATE TABLE inventory_txn (id BIGINT PRIMARY KEY AUTO_INCREMENT, note_id BIGINT, delta BIGINT, reason VARCHAR(50), ref_id VARCHAR(50), created_at TIMESTAMP);

CREATE TABLE manufacture_log (id BIGINT PRIMARY KEY AUTO_INCREMENT, recipe_id BIGINT, total_amount BIGINT, ref_id VARCHAR(50), created_at TIMESTAMP);
CREATE TABLE manufacture_log_item (id BIGINT PRIMARY KEY AUTO_INCREMENT, log_id BIGINT, note_id BIGINT, amount BIGINT);
