package com.moodrop.listener;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.translate.Translate;
import com.google.cloud.translate.TranslateOptions;
import com.google.cloud.translate.Translation;
import com.moodrop.entity.CommentInfo;
import com.moodrop.entity.Perfumes;
import com.moodrop.event.PerfumeCreatedEvent;
import com.moodrop.event.PerfumeElasticSearchEvent;
import com.moodrop.repository.CommentInfoRepository;
import com.moodrop.repository.PerfumeBasicRepository;
import com.moodrop.repository.PerfumeCommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.io.FileInputStream;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PerfumeTranslationListener {

    private final PerfumeBasicRepository perfumeRepository;
    private final PerfumeCommentRepository perfumeCommentRepository;
    private final CommentInfoRepository commentInfoRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${google.credentials.path}")
    private String credentialsPath;

    @Async("translationExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTranslation(PerfumeCreatedEvent event) {
        long start = System.currentTimeMillis();
        try {
            Translate translate = buildTranslateClient();

            Perfumes perfume = perfumeRepository.findById(event.getPerfumeId())
                    .orElseThrow(() -> new IllegalArgumentException("향수 없음: " + event.getPerfumeId()));

            // 1. description 번역 → descriptionKo 업데이트
            if (event.getDescription() != null && !event.getDescription().isBlank()) {
                String descKo = translateText(translate, event.getDescription());
                perfume.setDescriptionKo(descKo);
            }

            // 2. 각 comment 번역 → commentKo 업데이트
            List<CommentInfo> comments = perfumeCommentRepository
                    .findCommentInfosByPerfumeId(event.getPerfumeId());

            for (CommentInfo ci : comments) {
                if (ci.getComment() != null && !ci.getComment().isBlank()) {
                    String commentKo = translateText(translate, ci.getComment());
                    ci.setCommentKo(commentKo);
                    commentInfoRepository.save(ci);
                }
            }

            // 3. translation_status 완료 처리
            perfume.setTranslationStatus(true);
            perfumeRepository.save(perfume);


            // 4. 언어 번역이 마무리 됐을 때만,
            // Elastic Search에 RDB에 있는 데이터 동기화하기.
            eventPublisher.publishEvent(
                    new PerfumeElasticSearchEvent(perfume.getId())
            );

            log.info("perfumeId={} 번역 완료 ({}ms)", event.getPerfumeId(), System.currentTimeMillis() - start);

        } catch (Exception e) {
            log.error("perfumeId={} 번역 실패: {}", event.getPerfumeId(), e.getMessage(), e);
        }
    }

    private Translate buildTranslateClient() throws Exception {
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(new FileInputStream(credentialsPath))
                .createScoped("https://www.googleapis.com/auth/cloud-translation");

        return TranslateOptions.newBuilder()
                .setCredentials(credentials)
                .build()
                .getService();
    }

    private String translateText(Translate translate, String text) {
        Translation result = translate.translate(
                text,
                Translate.TranslateOption.sourceLanguage("en"),
                Translate.TranslateOption.targetLanguage("ko")
        );
        return result.getTranslatedText();
    }
}
