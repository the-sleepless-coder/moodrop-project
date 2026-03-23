package com.moodrop.listener;

import com.moodrop.elasticsearch.PerfumeEsDocument;
import com.moodrop.event.PerfumeQdrantEvent;
import com.moodrop.service.OllamaEmbedService;
import com.moodrop.service.QdrantVectorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.context.event.EventListener;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class PerfumeEmbeddingListener {

    private static final String COLLECTION   = "perfume_vectors_v2";
    private static final int    EMBED_DIM    = 768;
    private static final int    MAX_COMMENTS = 8;
    private static final int    OFFSET_AGG_EN = 0;
    private static final int    OFFSET_AGG_KO = 1;

    private final OllamaEmbedService  ollamaEmbedService;
    private final QdrantVectorService qdrantVectorService;

    @Async("embeddingExecutor")
    @EventListener
    public void handleQdrantEmbedding(PerfumeQdrantEvent event) {
        int perfumeId = event.getPerfumeId();
        long start = System.currentTimeMillis();
        log.info("[Embedding] 이벤트 수신 perfumeId={}", perfumeId);

        try {
            PerfumeEsDocument doc = event.getDocument();
            if (doc == null) {
                log.warn("[Embedding] perfumeId={} document 없음, skip", perfumeId);
                return;
            }

            // 2.댓글 및 설명을 합쳐서 텍스트 생성.
            qdrantVectorService.ensureCollection(COLLECTION, EMBED_DIM);

            String aggregateEn = buildAggregateText(doc.getDescription(), doc.getCommentsEng());
            String aggregateKo = buildAggregateText(doc.getDescriptionKo(), doc.getCommentsKo());

            if (aggregateEn == null && aggregateKo == null) {
                log.warn("[Embedding] perfumeId={} 텍스트 없음, skip", perfumeId);
                return;
            }

            List<String> noteNames = doc.getNotes() == null ? List.of() :
                    doc.getNotes().stream().map(PerfumeEsDocument.NoteDoc::getName).collect(Collectors.toList());
            List<String> accordNames = doc.getAccords() == null ? List.of() :
                    doc.getAccords().stream().map(PerfumeEsDocument.AccordDoc::getName).collect(Collectors.toList());
            String gender = doc.getGender() != null ? doc.getGender() : "unknown";
            String name   = doc.getName()   != null ? doc.getName()   : "";

            record Candidate(long pointId, String lang, String text) {}
            List<Candidate> candidates = new ArrayList<>();
            if (aggregateEn != null) candidates.add(new Candidate((long) perfumeId * 10 + OFFSET_AGG_EN, "en", aggregateEn));
            if (aggregateKo != null) candidates.add(new Candidate((long) perfumeId * 10 + OFFSET_AGG_KO, "ko", aggregateKo));

            // 3.ollama를 이용한 벡터화
            List<List<Double>> vectors = ollamaEmbedService.embedBatch(
                    candidates.stream().map(Candidate::text).toList());

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

            //4. Qdrant에 데이터 삽입.
            qdrantVectorService.upsert(COLLECTION, points);
            log.info("[Embedding] perfumeId={} Qdrant upsert 완료 ({}ms)", perfumeId, System.currentTimeMillis() - start);

        } catch (Exception e) {
            log.error("[Embedding] perfumeId={} 실패: {}", perfumeId, e.getMessage(), e);
        }
    }

    private String buildAggregateText(String description, String commentsRaw) {
        List<String> parts = new ArrayList<>();
        if (description != null && !description.isBlank()) parts.add(description.strip());
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
}
