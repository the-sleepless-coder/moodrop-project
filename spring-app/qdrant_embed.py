"""
Elasticsearch → Ollama embedding → Qdrant upsert pipeline

향수당 최대 18개 벡터:
  - description_eng   (1)
  - description_ko    (1)
  - comments_eng * 8  (최대 8)
  - comments_ko  * 8  (최대 8)

사용 예시:
  python qdrant_embed.py                              # 전체
  python qdrant_embed.py --from-id 1 --to-id 1000
  python qdrant_embed.py --from-id 1001 --to-id 2000
"""

import argparse
import time
import requests
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

# ──────────────────────────────────────────
# Config
# ──────────────────────────────────────────
ES_URL      = "http://localhost:9200"
ES_INDEX    = "perfumes_v2"
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
COLLECTION  = "perfume_vectors"
OLLAMA_URL  = "http://127.0.0.1:11434/api/embed"
EMBED_MODEL = "nomic-embed-text"
EMBED_DIM   = 768
MAX_COMMENTS = 8
SCROLL_SIZE  = 100
UPSERT_BATCH = 50
# perfume_id * 100 + 오프셋
# desc_en:      +0
# desc_ko:      +1
# comment_en_0~7: +2 ~ +9
# comment_ko_0~7: +10 ~ +17
OFFSET = {
    "desc_en": 0,
    "desc_ko": 1,
    **{f"comment_en_{i}": 2 + i  for i in range(8)},
    **{f"comment_ko_{i}": 10 + i for i in range(8)},
}

qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


# ──────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────

def embed_batch(texts: list[str]) -> list[list[float]]:
    """텍스트 리스트를 Ollama에 한 번에 요청 → 벡터 리스트 반환
    향수 1개당 Ollama 호출 1번 (18번 → 1번으로 감소)
    """
    resp = requests.post(
        OLLAMA_URL,
        json={"model": EMBED_MODEL, "input": texts},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["embeddings"]


def split_comments(raw: str, max_count: int = MAX_COMMENTS) -> list[str]:
    lines = [line.strip() for line in raw.split("\n") if line.strip()]
    return lines[:max_count]


def ensure_collection():
    existing = [c.name for c in qdrant.get_collections().collections]
    if COLLECTION not in existing:
        qdrant.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
        )
        print(f"[Init] Collection '{COLLECTION}' created.")
    else:
        print(f"[Init] Collection '{COLLECTION}' already exists.")


# ──────────────────────────────────────────
# ES scroll
# ──────────────────────────────────────────
def scroll_perfumes(from_id: int = None, to_id: int = None):
    """from_id ~ to_id 범위의 향수를 ES scroll로 순회.
    인자 없으면 전체 조회.
    """
    url = f"{ES_URL}/{ES_INDEX}/_search?scroll=2m"

    range_clause = {}
    if from_id is not None:
        range_clause["gte"] = from_id
    if to_id is not None:
        range_clause["lte"] = to_id

    body = {
        "size": SCROLL_SIZE,
        "_source": ["id", "description", "description_ko", "comments_eng", "comments_ko"],
        "query": {"range": {"id": range_clause}} if range_clause else {"match_all": {}},
    }

    resp = requests.post(url, json=body, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    scroll_id = data["_scroll_id"]
    hits = data["hits"]["hits"]

    while hits:
        for hit in hits:
            yield hit["_source"]

        resp = requests.post(
            f"{ES_URL}/_search/scroll",
            json={"scroll": "2m", "scroll_id": scroll_id},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        scroll_id = data["_scroll_id"]
        hits = data["hits"]["hits"]

    requests.delete(
        f"{ES_URL}/_search/scroll",
        json={"scroll_id": scroll_id},
        timeout=10,
    )


# ──────────────────────────────────────────
# 포인트 생성 (향수 1개 → Ollama 호출 1번)
# ──────────────────────────────────────────
def build_points(src: dict) -> list[PointStruct]:
    perfume_id = src.get("id")

    candidates: list[tuple[str, str, str, str]] = []

    if desc_en := (src.get("description") or "").strip():
        candidates.append((f"{perfume_id}_desc_en", "description", "en", desc_en))

    if desc_ko := (src.get("description_ko") or "").strip():
        candidates.append((f"{perfume_id}_desc_ko", "description", "ko", desc_ko))

    for i, text in enumerate(split_comments(src.get("comments_eng") or "")):
        candidates.append((f"{perfume_id}_comment_en_{i}", "comment", "en", text))

    for i, text in enumerate(split_comments(src.get("comments_ko") or "")):
        candidates.append((f"{perfume_id}_comment_ko_{i}", "comment", "ko", text))

    if not candidates:
        return []

    # 향수 1개의 모든 텍스트를 리스트로 묶어 Ollama에 한 번에 요청
    texts = [c[3] for c in candidates]
    try:
        vectors = embed_batch(texts)
    except Exception as e:
        print(f"  [WARN] embed_batch failed (perfume_id={perfume_id}): {e}")
        return []

    points = []
    for (key, source_type, lang, text), vector in zip(candidates, vectors):
        points.append(PointStruct(
            id=perfume_id * 100 + OFFSET[key],
            vector=vector,
            payload={
                "perfume_id": perfume_id,
                "source_type": source_type,
                "lang": lang,
                "text": text,
            },
        ))

    return points


# ──────────────────────────────────────────
# Main
# ──────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--from-id", type=int, default=None, help="시작 perfume id (포함)")
    parser.add_argument("--to-id",   type=int, default=None, help="끝 perfume id (포함)")
    args = parser.parse_args()

    print(f"[Config] range: {args.from_id} ~ {args.to_id} (None=제한없음)")
    ensure_collection()

    buffer: list[PointStruct] = []
    total_perfumes = 0
    total_points = 0
    start_total = time.time()

    for src in scroll_perfumes(from_id=args.from_id, to_id=args.to_id):
        perfume_id = src.get("id", "?")

        points = build_points(src)

        if not points:
            print(f"  [SKIP] perfume_id={perfume_id} (no embeddable text)")
            continue

        buffer.extend(points)
        total_perfumes += 1
        total_points += len(points)

        if total_perfumes % 10 == 0:
            elapsed = time.time() - start_total
            print(f"  [Progress] {total_perfumes} perfumes / {total_points} vectors "
                  f"| elapsed={elapsed:.1f}s | avg={elapsed/total_perfumes*1000:.0f}ms/perfume")

        if len(buffer) >= UPSERT_BATCH:
            t1 = time.time()
            qdrant.upsert(collection_name=COLLECTION, points=buffer)
            upsert_ms = (time.time() - t1) * 1000
            print(f"  [Upsert] {len(buffer)} points flushed | upsert={upsert_ms:.0f}ms")
            buffer.clear()

    if buffer:
        qdrant.upsert(collection_name=COLLECTION, points=buffer)
        print(f"  [Upsert] {len(buffer)} points flushed (final)")

    print(f"\n[Done] Total: {total_perfumes} perfumes, {total_points} vectors inserted.")


if __name__ == "__main__":
    main()
