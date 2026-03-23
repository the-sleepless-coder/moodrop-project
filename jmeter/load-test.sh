#!/bin/bash

# ========== 변수 설정 ==========
THREADS=10
LOOP_COUNT=10
JWT_TOKEN="여기에_JWT_토큰_입력"
HOST="localhost"
PORT="8080"
# ================================

send_request() {
  local id=$1
  local name="TheGreatest De Chanel $(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || echo "$id-$(date +%s%N)")"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "http://$HOST:$PORT/api/perfume/addPerfume" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
  \"name\": \"$name\",
  \"brandName\": \"Chanel\",
  \"country\": \"France\",
  \"ratingVal\": 4.2,
  \"ratingCount\": 3850,
  \"perfumeComment\": [\"A fresh and clean woody aromatic fragrance with citrus and cedar notes.\", \"Great after scent and aroma\"],
  \"perfumeLongevity\": \"long lasting\",
  \"perfumeLongevityVotes\": 1200,
  \"perfumeSillage\": \"heavy\",
  \"perfumeSillageVotes\": 980,
  \"season\": \"spring\",
  \"seasonWeight\": 75,
  \"perfumeDayNight\": \"day\",
  \"perfumeDayNightWeight\": 60,
  \"description\": \"Bleu de Chanel is a woody aromatic fragrance for men. Launched in 2010. it really is the best perfume that I have ever seen.\",
  \"year\": 2010,
  \"genderType\": \"men\",
  \"s3Key\": \"perfume/image/korean_de_chanel_Chanel_2010\"
}")

  if [ "$status" == "200" ]; then
    echo "[OK] id=$id status=$status"
  else
    echo "[FAIL] id=$id status=$status"
  fi
}

echo "=== 시작: THREADS=$THREADS LOOP=$LOOP_COUNT ==="
START=$(date +%s)

for ((loop=1; loop<=LOOP_COUNT; loop++)); do
  for ((t=1; t<=THREADS; t++)); do
    send_request "$t-$loop" &
  done
  wait
done

END=$(date +%s)
echo "=== 완료: $((END - START))초 소요 ==="
