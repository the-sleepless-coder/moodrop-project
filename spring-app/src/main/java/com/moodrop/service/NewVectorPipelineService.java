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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewVectorPipelineService {

    private static final String COLLECTION  = "perfume_vectors_v2";
    private static final int    EMBED_DIM   = 768;
    private static final int    MAX_COMMENTS = 8;
    private static final int    UPSERT_BATCH = 50;
    private static final int    PAGE_SIZE    = 100;

    // perfume_id * 10 + OFFSET
    private static final int OFFSET_AGG_EN = 0;
    private static final int OFFSET_AGG_KO = 1;

    private final ElasticsearchOperations elasticsearchOperations;
    private final OllamaEmbedService      ollamaEmbedService;
    private final QdrantVectorService     qdrantVectorService;

    @Async("vectorExecutor")
    public void runAsync(Integer fromId, Integer toId) {
        log.info("[NewPipeline] Start - range: {} ~ {}", fromId, toId);
        long startTime = System.currentTimeMillis();

        qdrantVectorService.ensureCollection(COLLECTION, EMBED_DIM);

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
                    log.warn("[NewPipeline] SKIP perfume_id={} (no text)", doc.getId());
                    continue;
                }

                buffer.addAll(points);
                totalPerfumes++;
                totalPoints += points.size();

                if (totalPerfumes % 10 == 0) {
                    long elapsed = System.currentTimeMillis() - startTime;
                    log.info("[NewPipeline] {} perfumes / {} vectors | elapsed={}s | avg={}ms/perfume",
                            totalPerfumes, totalPoints,
                            elapsed / 1000,
                            elapsed / totalPerfumes);
                }

                if (buffer.size() >= UPSERT_BATCH) {
                    qdrantVectorService.upsert(COLLECTION, buffer);
                    log.info("[NewPipeline] Upsert {} points", buffer.size());
                    buffer.clear();
                }
            }
            page++;
        }

        if (!buffer.isEmpty()) {
            qdrantVectorService.upsert(COLLECTION, buffer);
            log.info("[NewPipeline] Upsert {} points (final)", buffer.size());
        }

        long total = System.currentTimeMillis() - startTime;
        log.info("[NewPipeline] Done - {} perfumes / {} vectors | total={}s",
                totalPerfumes, totalPoints, total / 1000);
    }

    private List<Map<String, Object>> buildPoints(PerfumeEsDocument doc) {
        int perfumeId = doc.getId();

        // description + comments 를 하나의 텍스트로 합산
        String aggregateEn = buildAggregateText(doc.getDescription(), doc.getCommentsEng());
        String aggregateKo = buildAggregateText(doc.getDescriptionKo(), doc.getCommentsKo());

        // 둘 다 없으면 skip
        if (aggregateEn == null && aggregateKo == null) return Collections.emptyList();

        // 공통 메타데이터
        List<String> noteNames = doc.getNotes() == null ? List.of() :
                doc.getNotes().stream().map(PerfumeEsDocument.NoteDoc::getName).collect(Collectors.toList());

        List<String> accordNames = doc.getAccords() == null ? List.of() :
                doc.getAccords().stream().map(PerfumeEsDocument.AccordDoc::getName).collect(Collectors.toList());

        String gender = doc.getGender() != null ? doc.getGender() : "unknown";
        String name   = doc.getName()   != null ? doc.getName()   : "";

        // 임베딩할 텍스트 목록 구성 (순서 고정)
        record Candidate(long pointId, String lang, String text) {}
        List<Candidate> candidates = new ArrayList<>();

        if (aggregateEn != null) {
            candidates.add(new Candidate((long) perfumeId * 10 + OFFSET_AGG_EN, "en", aggregateEn));
        }
        if (aggregateKo != null) {
            candidates.add(new Candidate((long) perfumeId * 10 + OFFSET_AGG_KO, "ko", aggregateKo));
        }

        List<String> texts = candidates.stream().map(Candidate::text).toList();
        List<List<Double>> vectors;
        try {
            vectors = ollamaEmbedService.embedBatch(texts);
        } catch (Exception e) {
            log.warn("[NewPipeline] embedBatch failed perfume_id={}: {}", perfumeId, e.getMessage());
            return Collections.emptyList();
        }

        List<Map<String, Object>> points = new ArrayList<>();
        for (int i = 0; i < candidates.size(); i++) {
            Candidate c = candidates.get(i);
            points.add(Map.of(
                    "id",      c.pointId(),
                    "vector",  vectors.get(i),
                    "payload", Map.of(
                            "perfume_id", perfumeId,
                            "name",       name,
                            "gender",     gender,
                            "notes",      noteNames,
                            "accords",    accordNames,
                            "lang",       c.lang(),
                            "text",       c.text()
                    )
            ));
        }
        return points;
    }

    /**
     * description + comments 를 "\n\n" 구분자로 이어 붙인다.
     * 둘 다 없으면 null 반환.
     */
    private String buildAggregateText(String description, String commentsRaw) {
        List<String> parts = new ArrayList<>();

        if (description != null && !description.isBlank()) {
            parts.add(description.strip());
        }

        if (commentsRaw != null && !commentsRaw.isBlank()) {
            Arrays.stream(commentsRaw.split("\n"))
                    .map(String::strip)
                    .filter(s -> !s.isEmpty())
                    .limit(MAX_COMMENTS)
                    .forEach(parts::add);
        }

        if (parts.isEmpty()) return null;
        return String.join("\n\n", parts);
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
}
