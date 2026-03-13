-- user_perfumes 테이블에 rating_count 컬럼 추가
-- 델타 방식 평균 계산을 위한 스키마 변경

ALTER TABLE user_perfumes
ADD COLUMN rating_count INT NOT NULL DEFAULT 0 COMMENT '별점 개수 (델타 계산용)'
AFTER rating_average;

-- rating_average의 타입을 DECIMAL로 변경 (소수점 정확도 향상)
ALTER TABLE user_perfumes
MODIFY COLUMN rating_average DECIMAL(3,2) NOT NULL DEFAULT 0.00 COMMENT '평균 별점 (소수점 2자리)';

-- 기존 데이터에 대해 rating_count 초기화
UPDATE user_perfumes up
SET rating_count = (
    SELECT COUNT(*)
    FROM recipe_rating rr
    WHERE rr.recipe_id = up.id
);

-- 확인 쿼리
SELECT id, name, rating_average, rating_count
FROM user_perfumes
LIMIT 10;
