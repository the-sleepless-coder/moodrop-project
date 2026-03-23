package com.moodrop.service;

import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import com.moodrop.elasticsearch.PerfumeEsDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class VectorPipelineService {

    private static final String COLLECTION   = "perfume_vectors";
    private static final int    EMBED_DIM    = 768;
    private static final int    MAX_COMMENTS = 8;
    private static final int    UPSERT_BATCH = 50;
    private static final int    PAGE_SIZE    = 100;

    // perfume_id * 100 + OFFSET[type]
    // desc_en:0, desc_ko:1, comment_en_0~7:2~9, comment_ko_0~7:10~17
    private static final int OFFSET_DESC_EN      = 0;
    private static final int OFFSET_DESC_KO      = 1;
    private static final int OFFSET_COMMENT_EN_0 = 2;
    private static final int OFFSET_COMMENT_KO_0 = 10;

    private final ElasticsearchOperations elasticsearchOperations;
    private final OllamaEmbedService      ollamaEmbedService;
    private final QdrantVectorService     qdrantVectorService;

    @Async("vectorExecutor")
    public void runAsync(Integer fromId, Integer toId) {
        log.info("[Pipeline] Start - range: {} ~ {}", fromId, toId);
        long startTime = System.currentTimeMillis();

        qdrantVectorService.ensureCollection(COLLECTION, EMBED_DIM);

        // ES 범위 쿼리 구성
        Query query = buildRangeQuery(fromId, toId);

        List<Map<String, Object>> buffer = new ArrayList<>();
        int totalPerfumes = 0;
        int totalPoints   = 0;
        int page          = 0;

        while (true) {
            NativeQuery nativeQuery = NativeQuery.builder()
                    .withQuery(query)
                    .withPageable(PageRequest.of(page, PAGE_SIZE))
                    .build();

            SearchHits<PerfumeEsDocument> searchHits =
                    elasticsearchOperations.search(nativeQuery, PerfumeEsDocument.class);

            if (searchHits.isEmpty()) break;

            for (SearchHit<PerfumeEsDocument> hit : searchHits) {
                PerfumeEsDocument doc = hit.getContent();
                List<Map<String, Object>> points = buildPoints(doc);

                if (points.isEmpty()) {
                    log.warn("[Pipeline] SKIP perfume_id={} (no text)", doc.getId());
                    continue;
                }

                buffer.addAll(points);
                totalPerfumes++;
                totalPoints += points.size();

                if (totalPerfumes % 10 == 0) {
                    long elapsed = System.currentTimeMillis() - startTime;
                    log.info("[Pipeline] {} perfumes / {} vectors | elapsed={}s | avg={}ms/perfume",
                            totalPerfumes, totalPoints,
                            elapsed / 1000,
                            elapsed / totalPerfumes);
                }

                if (buffer.size() >= UPSERT_BATCH) {
                    qdrantVectorService.upsert(COLLECTION, buffer);
                    log.info("[Pipeline] Upsert {} points", buffer.size());
                    buffer.clear();
                }
            }
            page++;
        }

        if (!buffer.isEmpty()) {
            qdrantVectorService.upsert(COLLECTION, buffer);
            log.info("[Pipeline] Upsert {} points (final)", buffer.size());
        }

        long total = System.currentTimeMillis() - startTime;
        log.info("[Pipeline] Done - {} perfumes / {} vectors | total={}s",
                totalPerfumes, totalPoints, total / 1000);
    }

    private List<Map<String, Object>> buildPoints(PerfumeEsDocument doc) {
        int perfumeId = doc.getId();

        // (offsetKey, source_type, lang, text)
        record Candidate(long pointId, String sourceType, String lang, String text) {}
        List<Candidate> candidates = new ArrayList<>();

        if (hasText(doc.getDescription())) {
            candidates.add(new Candidate(
                    (long) perfumeId * 100 + OFFSET_DESC_EN, "description", "en", doc.getDescription()));
        }
        if (hasText(doc.getDescriptionKo())) {
            candidates.add(new Candidate(
                    (long) perfumeId * 100 + OFFSET_DESC_KO, "description", "ko", doc.getDescriptionKo()));
        }

        List<String> commentsEn = splitComments(doc.getCommentsEng());
        for (int i = 0; i < commentsEn.size(); i++) {
            candidates.add(new Candidate(
                    (long) perfumeId * 100 + OFFSET_COMMENT_EN_0 + i, "comment", "en", commentsEn.get(i)));
        }

        List<String> commentsKo = splitComments(doc.getCommentsKo());
        for (int i = 0; i < commentsKo.size(); i++) {
            candidates.add(new Candidate(
                    (long) perfumeId * 100 + OFFSET_COMMENT_KO_0 + i, "comment", "ko", commentsKo.get(i)));
        }

        if (candidates.isEmpty()) return Collections.emptyList();

        // 향수 1개의 모든 텍스트를 한 번에 Ollama 요청
        List<String> texts = candidates.stream().map(Candidate::text).toList();
        List<List<Double>> vectors;
        try {
            vectors = ollamaEmbedService.embedBatch(texts);
        } catch (Exception e) {
            log.warn("[Pipeline] embedBatch failed perfume_id={}: {}", perfumeId, e.getMessage());
            return Collections.emptyList();
        }

        List<Map<String, Object>> points = new ArrayList<>();
        for (int i = 0; i < candidates.size(); i++) {
            Candidate c = candidates.get(i);
            points.add(Map.of(
                    "id",      c.pointId(),
                    "vector",  vectors.get(i),
                    "payload", Map.of(
                            "perfume_id",  perfumeId,
                            "source_type", c.sourceType(),
                            "lang",        c.lang(),
                            "text",        c.text()
                    )
            ));
        }
        return points;
    }

    private Query buildRangeQuery(Integer fromId, Integer toId) {
        if (fromId == null && toId == null) {
            return Query.of(q -> q.matchAll(m -> m));
        }
        Integer from = fromId;
        Integer to   = toId;
        return Query.of(q -> q.range(r -> r.number(n -> {
            n.field("id");
            if (from != null) n.gte(from.doubleValue());
            if (to   != null) n.lte(to.doubleValue());
            return n;
        })));
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private List<String> splitComments(String raw) {
        if (!hasText(raw)) return Collections.emptyList();
        return Arrays.stream(raw.split("\n"))
                .map(String::strip)
                .filter(s -> !s.isEmpty())
                .limit(MAX_COMMENTS)
                .toList();
    }
}
