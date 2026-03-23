package com.moodrop.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.translate.Translate;
import com.google.cloud.translate.TranslateOptions;
import com.google.cloud.translate.Translation;
import com.moodrop.DTO.PerfumeBasicWithS3KeyDto;
import com.moodrop.Enums.ImageType;
import com.moodrop.elasticsearch.ElasticBulkService;
import net.coobird.thumbnailator.Thumbnails;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import com.moodrop.elasticsearch.PerfumeEsDocument;
import com.moodrop.entity.*;
import com.moodrop.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * [테스트용] 비동기 파이프라인을 단일 트랜잭션으로 묶은 서비스.
 * DB 커넥션 점유 시간을 Grafana(11378)에서 비교하기 위해 사용.
 *
 * 비동기(addPerfume) vs 동기(addPerfumeTest) 비교:
 *   - hikaricp_connections_usage_seconds: 비동기 ~10ms / 동기 ~2300ms+
 *   - hikaricp_connections_pending: 부하 시 동기에서만 발생
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TestPerfumeService {

    private static final String COLLECTION   = "perfume_vectors_v2";
    private static final int    EMBED_DIM    = 768;
    private static final int    MAX_COMMENTS = 8;
    private static final int    OFFSET_AGG_EN = 0;
    private static final int    OFFSET_AGG_KO = 1;

    private final BrandInfoRepository brandInfoRepo;
    private final CountryInfoRepository countryInfoRepo;
    private final RatingInfoRepository ratingInfoRepo;
    private final PerfumeBasicRepository perfumeRepo;
    private final PerfumeSeasonRepository perfumeSeasonRepo;
    private final PerfumeDayNightRepository perfumeDayNightRepo;
    private final PerfumeLongevityRepository perfumeLongevityRepo;
    private final PerfumeSillageRepository perfumeSillageRepo;
    private final CommentInfoRepository commentInfoRepo;
    private final PerfumeCommentRepository perfumeCommentRepo;
    private final PerfumeImageRepository perfumeImageRepo;
    private final LongevityInfoRepository longevityInfoRepo;
    private final SillageInfoRepository sillageInfoRepo;

    private final EntityManager entityManager;
    private final S3UploadService s3UploadService;

    private final ElasticBulkService elasticBulkService;
    private final OllamaEmbedService ollamaEmbedService;
    private final QdrantVectorService qdrantVectorService;

    @Value("${google.credentials.path}")
    private String credentialsPath;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    /**
     * DB 저장 → 번역 → ES 인덱싱 → Ollama 임베딩 → Qdrant 저장
     * 모두 단일 @Transactional 내에서 실행 → DB 커넥션 전 구간 점유
     */
    @Transactional
    public Perfumes savePerfumeSync(PerfumeBasicWithS3KeyDto dto) {
        long start = System.currentTimeMillis();

        Optional<Perfumes> existing = perfumeRepo.findByName(dto.getName());
        if (existing.isPresent()) {
            return existing.get();
        }

        // ── 1. DB 저장 ────────────────────────────────────────────────
        BrandInfo brand = brandInfoRepo.findByName(dto.getBrandName())
                .orElseGet(() -> brandInfoRepo.save(new BrandInfo(null, dto.getBrandName())));

        CountryInfo country = countryInfoRepo.findByCountry(dto.getCountry())
                .orElseGet(() -> countryInfoRepo.save(new CountryInfo(null, dto.getCountry())));

        RatingInfo rating = ratingInfoRepo.save(new RatingInfo(null, dto.getRatingVal(), dto.getRatingCount()));

        Perfumes perfume = new Perfumes();
        perfume.setName(dto.getName());
        perfume.setBrand(brand);
        perfume.setCountry(country);
        perfume.setRating(rating);
        perfume.setDescription(dto.getDescription());
        perfume.setGender(dto.getGenderType());
        perfume.setYear(dto.getYear());

        Perfumes saved = perfumeRepo.save(perfume);
        Integer perfumeId = saved.getId();

        if (dto.getSeason() != null)
            perfumeSeasonRepo.save(new PerfumeSeason(perfumeId, dto.getSeason(), dto.getSeasonWeight(), null));

        if (dto.getPerfumeDayNight() != null)
            perfumeDayNightRepo.save(new PerfumeDayNight(perfumeId, dto.getPerfumeDayNight(), dto.getPerfumeDayNightWeight(), null));

        if (dto.getPerfumeLongevity() != null) {
            LongevityInfo longevity = longevityInfoRepo.findByLength(dto.getPerfumeLongevity())
                    .orElseGet(() -> longevityInfoRepo.save(new LongevityInfo(null, dto.getPerfumeLongevity())));
            perfumeLongevityRepo.save(new PerfumeLongevity(perfumeId, longevity.getId(), dto.getPerfumeLongevityVotes(), null, null));
        }

        if (dto.getPerfumeSillage() != null) {
            SillageInfo sillage = sillageInfoRepo.findByStrength(dto.getPerfumeSillage())
                    .orElseGet(() -> sillageInfoRepo.save(new SillageInfo(null, dto.getPerfumeSillage())));
            perfumeSillageRepo.save(new PerfumeSillage(perfumeId, sillage.getId(), dto.getPerfumeSillageVotes(), null, null));
        }

        if (dto.getPerfumeComment() != null && !dto.getPerfumeComment().isEmpty()) {
            for (String commentText : dto.getPerfumeComment()) {
                CommentInfo comment = commentInfoRepo.save(new CommentInfo(null, commentText, null));
                PerfumeCommentId cid = new PerfumeCommentId(perfumeId, comment.getId());
                perfumeCommentRepo.save(new PerfumeComment(cid, saved, comment));
            }
        }

        String s3Key = dto.getS3Key();
        String url = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + s3Key;
        PerfumeImage original = new PerfumeImage();
        original.setPerfume(saved);
        original.setImageType(ImageType.ORIGINAL);
        original.setS3Key(s3Key);
        original.setImageUrl(url);
        perfumeImageRepo.save(original);

        log.info("[TestSync] perfumeId={} DB저장 완료 ({}ms)", perfumeId, System.currentTimeMillis() - start);

        // ── 2. 썸네일 생성 (S3 다운로드 → 리사이즈 → S3 업로드 → DB 저장) ──
        try {
            byte[] originalBytes = s3UploadService.downloadBytes(s3Key);

            BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(originalBytes));
            original.setWidth(bufferedImage.getWidth());
            original.setHeight(bufferedImage.getHeight());
            perfumeImageRepo.save(original);

            ByteArrayOutputStream thumbOut = new ByteArrayOutputStream();
            Thumbnails.of(new ByteArrayInputStream(originalBytes))
                    .size(300, 300)
                    .keepAspectRatio(true)
                    .outputFormat("jpg")
                    .toOutputStream(thumbOut);

            String thumbKey = s3Key.replace("perfume/image/", "perfume/image/thumb_");
            String thumbUrl = s3UploadService.uploadBytes(thumbOut.toByteArray(), thumbKey, "image/jpeg");

            PerfumeImage thumbnail = new PerfumeImage();
            thumbnail.setPerfume(saved);
            thumbnail.setImageType(ImageType.THUMBNAIL);
            thumbnail.setS3Key(thumbKey);
            thumbnail.setImageUrl(thumbUrl);
            thumbnail.setWidth(300);
            thumbnail.setHeight(300);
            perfumeImageRepo.save(thumbnail);

            saved.setImageStatus(true);
            perfumeRepo.save(saved);

            log.info("[TestSync] perfumeId={} 썸네일 완료 ({}ms)", perfumeId, System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.error("[TestSync] perfumeId={} 썸네일 실패: {}", perfumeId, e.getMessage());
        }

        // ── 4. 번역 (Google Translate) ────────────────────────────────
        try {
            Translate translate = buildTranslateClient();

            if (dto.getDescription() != null && !dto.getDescription().isBlank()) {
                String descKo = translateText(translate, dto.getDescription());
                saved.setDescriptionKo(descKo);
            }

            List<CommentInfo> comments = perfumeCommentRepo.findCommentInfosByPerfumeId(perfumeId);
            for (CommentInfo ci : comments) {
                if (ci.getComment() != null && !ci.getComment().isBlank()) {
                    ci.setCommentKo(translateText(translate, ci.getComment()));
                    commentInfoRepo.save(ci);
                }
            }
            saved.setTranslationStatus(true);
            perfumeRepo.save(saved);

            log.info("[TestSync] perfumeId={} 번역 완료 ({}ms)", perfumeId, System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.error("[TestSync] perfumeId={} 번역 실패: {}", perfumeId, e.getMessage());
        }

        // ── 5. ES 인덱싱 ─────────────────────────────────────────────
        // flush: 지금까지 저장한 엔티티를 DB에 반영
        // clear: 1차 캐시 초기화 → longevityInfo 등 LAZY 연관이 null인 채로 캐시된 것을 제거
        //        → 이후 indexSingle 내부의 JOIN FETCH 쿼리가 DB에서 정상 조회됨
        entityManager.flush();
        entityManager.clear();

        PerfumeEsDocument doc = null;
        try {
            doc = elasticBulkService.indexSingle(perfumeId);
            log.info("[TestSync] perfumeId={} ES 인덱싱 완료 ({}ms)", perfumeId, System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.error("[TestSync] perfumeId={} ES 인덱싱 실패: {}", perfumeId, e.getMessage());
        }

        // ── 6. Ollama 임베딩 + Qdrant 저장 ───────────────────────────
        if (doc != null) {
            try {
                qdrantVectorService.ensureCollection(COLLECTION, EMBED_DIM);

                String aggregateEn = buildAggregateText(doc.getDescription(), doc.getCommentsEng());
                String aggregateKo = buildAggregateText(doc.getDescriptionKo(), doc.getCommentsKo());

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

                if (!candidates.isEmpty()) {
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
                    qdrantVectorService.upsert(COLLECTION, points);
                }

                log.info("[TestSync] perfumeId={} Qdrant upsert 완료 ({}ms)", perfumeId, System.currentTimeMillis() - start);
            } catch (Exception e) {
                log.error("[TestSync] perfumeId={} Qdrant 실패: {}", perfumeId, e.getMessage());
            }
        }

        log.info("[TestSync] perfumeId={} 전체 완료 (총 {}ms) ← DB 커넥션 전구간 점유", perfumeId, System.currentTimeMillis() - start);
        return saved;
    }

    private Translate buildTranslateClient() throws Exception {
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(new FileInputStream(credentialsPath))
                .createScoped("https://www.googleapis.com/auth/cloud-translation");
        return TranslateOptions.newBuilder().setCredentials(credentials).build().getService();
    }

    private String translateText(Translate translate, String text) {
        Translation result = translate.translate(
                text,
                Translate.TranslateOption.sourceLanguage("en"),
                Translate.TranslateOption.targetLanguage("ko")
        );
        return result.getTranslatedText();
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
        return parts.isEmpty() ? null : String.join("\n\n", parts);
    }
}
