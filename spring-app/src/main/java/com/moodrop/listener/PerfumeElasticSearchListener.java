package com.moodrop.listener;

import com.moodrop.elasticsearch.ElasticBulkService;
import com.moodrop.elasticsearch.PerfumeEsDocument;
import com.moodrop.event.PerfumeElasticSearchEvent;
import com.moodrop.event.PerfumeQdrantEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class PerfumeElasticSearchListener {

    private final ElasticBulkService elasticBulkService;
    private final ApplicationEventPublisher eventPublisher;

    @Async("elasticSearchExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleElasticSearch(PerfumeElasticSearchEvent event) {
        long start = System.currentTimeMillis();
        try {
            PerfumeEsDocument doc = elasticBulkService.indexSingle(event.getPerfumeId());
            log.info("perfumeId={} ES 인덱싱 완료 ({}ms)", event.getPerfumeId(), System.currentTimeMillis() - start);

            eventPublisher.publishEvent(new PerfumeQdrantEvent(event.getPerfumeId(), doc));

        } catch (Exception e) {
            log.error("perfumeId={} ES 인덱싱 실패: {}", event.getPerfumeId(), e.getMessage(), e);
        }
    }
}
