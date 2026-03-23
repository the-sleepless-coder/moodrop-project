package com.moodrop.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.translate.Translate;
import com.google.cloud.translate.TranslateOptions;
import com.google.cloud.translate.Translation;
import com.moodrop.DTO.FragranceQueryResult;
import com.moodrop.DTO.UserPersonalizationDto;
import com.moodrop.DTO.VectorSearchResultDto;
import com.moodrop.Enums.UserGender;
import com.moodrop.elasticsearch.PerfumeEsDocument;
import com.moodrop.elasticsearch.PerfumeEsRepository;
import com.moodrop.entity.User;
import com.moodrop.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.FileInputStream;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class VectorSearchService {

    private static final String COLLECTION = "perfume_vectors_v2";

    private final OllamaEmbedService ollamaEmbedService;
    private final OllamaLlmService ollamaLlmService;
    private final UserPersonalizationService userPersonalizationService;
    private final PerfumeEsRepository perfumeEsRepository;
    private final RestTemplate restTemplate;
    private final String qdrantUrl;
    private final UserRepository userRepository;
    private final OpenAiLlmService openAiLlmService;

    @Value("${google.credentials.path}")
    private String credentialsPath;

    public VectorSearchService(OllamaEmbedService ollamaEmbedService,
                               OllamaLlmService ollamaLlmService,
                               UserPersonalizationService userPersonalizationService,
                               PerfumeEsRepository perfumeEsRepository,
                               RestTemplateBuilder builder,
                               @Value("${qdrant.url}") String qdrantUrl,
                               UserRepository userRepository, OpenAiLlmService openAiLlmService) {
        this.ollamaEmbedService = ollamaEmbedService;
        this.ollamaLlmService = ollamaLlmService;
        this.userPersonalizationService = userPersonalizationService;
        this.perfumeEsRepository = perfumeEsRepository;
        this.restTemplate = builder.build();
        this.qdrantUrl = qdrantUrl;
        this.userRepository = userRepository;
        this.openAiLlmService = openAiLlmService;
    }

    /**
     * 쿼리 텍스트를 임베딩해서 Qdrant에서 유사한 향수 검색
     *
     * @param query 검색어
     * @param lang  필터 (en / ko / null=전체)
     * @param type  필터 (description / comment / null=전체)
     * @param topK  반환 개수
     */
    @SuppressWarnings("unchecked")
    public VectorSearchResultDto search(String query, String lang, String type, int topK) {
        // 1. OpenAI로 교체해서, 문맥으로 변환하는 텍스트의 정확도를 높임.
        // LLM으로 쿼리를 향수 묘사 언어로 변환 + gender 추출
        FragranceQueryResult llmResult = openAiLlmService.convertToFragranceQuery(query);
        List<List<Double>> vectors = ollamaEmbedService.embedBatch(List.of(llmResult.getDescription()));
        List<Double> queryVector = vectors.get(0);

        // 2. Qdrant 필터 구성
        Map<String, Object> filter = buildFilter(lang, type);

        // 3. Qdrant search 요청
        Map<String, Object> body = filter != null
                ? Map.of("vector", queryVector, "limit", topK, "with_payload", true, "filter", filter)
                : Map.of("vector", queryVector, "limit", topK, "with_payload", true);

        Map<String, Object> response = restTemplate.postForObject(
                qdrantUrl + "/collections/" + COLLECTION + "/points/search",
                body,
                Map.class
        );

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("result");

        //log.info("[Qdrant] Candidates: "+candidates.stream().limit(5).toList());

        String gender = llmResult.getGender();
        if ("female".equals(gender) || "male".equals(gender)) {
            String keyword = "female".equals(gender) ? "women" : "men";
            candidates = candidates.stream()
                    .filter(c -> {
                        Map<String, Object> payload = (Map<String, Object>) c.get("payload");
                        String text = payload != null ? (String) payload.getOrDefault("text", "") : "";
                        String firstSentence = text.contains(".") ? text.substring(0, text.indexOf(".")).toLowerCase() : text.toLowerCase();
                        return firstSentence.contains("for " + keyword);
                    })
                    .collect(java.util.stream.Collectors.toList());
        }

        return new VectorSearchResultDto(gender, candidates);
    }


    /**
     * 한국어 쿼리를 영어로 번역 후 검색 (임시: nomic 모델이 영어 전용이라 번역 우회)
     * 추후 다국어 모델로 교체 시 제거 예정
     */
    public VectorSearchResultDto temporaryTranslationSearch(String query, String lang, String type, int topK, String userIdStr) {
        String searchQuery = isKorean(query) ? translateToEnglish(query) : query;
        log.info("[TempTranslationSearch] '{}' → '{}'", query, searchQuery);

        // 1. 벡터 검색
        VectorSearchResultDto result = search(searchQuery, lang, type, topK);
        String targetGender = result.getGender();

        // 2. 사용자 개인화 데이터 수집
        UserPersonalizationDto personalization = userPersonalizationService.fetch(userIdStr);
        User user = userRepository.findByUserId(userIdStr).orElse(null);
        UserGender userGender = user != null ? user.getGender() : UserGender.unknown;

        log.info("[TempTranslationSearch] userId={} userGender={} targetGender={} likedNotes={} likedAccords={} recentSearches={}",
                userIdStr, userGender, targetGender,
                personalization.getLikedNotes().size(),
                personalization.getLikedAccords().size(),
                personalization.getRecentSearchIds().size());

        // 3. 개인화 스코어링으로 최종 5개 선정
        List<Map<String, Object>> top5;
        if (targetGender.equals(userGender.toString())) {
            // 사용자 gender와 타겟 gender가 일치 → 개인화 스코어링 적용
            top5 = recommendFinalPerfumes(result.getCandidates(), personalization);
        } else {
            // 일치하지 않으면 Qdrant score 순 상위 5개 그대로 반환
            top5 = result.getCandidates().stream().limit(5).collect(Collectors.toList());
        }

        VectorSearchResultDto top5Result = new VectorSearchResultDto(targetGender, top5);

        return top5Result;

    }

    private Map<String, Object> buildFilter(String lang, String type) {
        List<Map<String, Object>> conditions = new ArrayList<>();

        if (lang != null && !lang.isBlank()) {
            conditions.add(Map.of("key", "lang", "match", Map.of("value", lang)));
        }
        if (type != null && !type.isBlank()) {
            conditions.add(Map.of("key", "source_type", "match", Map.of("value", type)));
        }

        if (conditions.isEmpty()) return null;

        return Map.of("must", conditions);
    }


    /**
     * 후보군에서 개인화 스코어링으로 상위 5개 선정
     *
     * 가중치:
     *   composedNotes 있을 때: composed 50% + liked 35% + recentSearch 15%
     *   composedNotes 없을 때: liked 70% + recentSearch 30%
     *   사용자 데이터가 아예 없으면: 그대로 상위 5개 반환.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> recommendFinalPerfumes(
            List<Map<String, Object>> candidates,
            UserPersonalizationDto p) {

        // 1. perfume_id 기준 중복 제거 (같은 향수가 desc/comment 여러 벡터로 등장) → Qdrant score 가장 높은 것 유지
        Map<Integer, Map<String, Object>> bestByPerfume = new LinkedHashMap<>();
        for (Map<String, Object> c : candidates) {
            Map<String, Object> payload = (Map<String, Object>) c.get("payload");
            Integer perfumeId = (Integer) payload.get("perfume_id");
            bestByPerfume.merge(perfumeId, c, (existing, incoming) ->
                    ((Number) incoming.get("score")).doubleValue() > ((Number) existing.get("score")).doubleValue()
                            ? incoming : existing
            );
        }

        // Qdrant score 기준 상위 5개 로그
        bestByPerfume.values().stream()
                .sorted((a, b) -> Double.compare(((Number) b.get("score")).doubleValue(), ((Number) a.get("score")).doubleValue()))
                .limit(5)
                .forEach(c -> {
                    Map<String, Object> pl = (Map<String, Object>) c.get("payload");
                    log.info("[Top5 Candidates] perfumeId={} qdrantScore={}", pl.get("perfume_id"), String.format("%.4f", ((Number) c.get("score")).doubleValue()));
                });

        // 2. ES에서 후보 향수 속성 일괄 조회
        List<Integer> perfumeIds = new ArrayList<>(bestByPerfume.keySet());
        Map<Integer, PerfumeEsDocument> esDocMap = new HashMap<>();
        perfumeEsRepository.findAllById(perfumeIds)
                .forEach(doc -> esDocMap.put(doc.getId(), doc));

        log.info("[Personalization] likedNotes={} likedAccords={} topSeason={} topDayNight={} composedNotes={} recentNotes={} recentAccords={}",
                p.getLikedNotes(),
                p.getLikedAccords(),
                p.getLikedSeasons().isEmpty() ? null : p.getLikedSeasons().keySet().iterator().next(),
                p.getLikedDayNight().isEmpty() ? null : p.getLikedDayNight().keySet().iterator().next(),
                p.getComposedNotes(),
                p.getRecentNotes(),
                p.getRecentAccords());

        // 3. 정규화에 필요한 사전 계산
        boolean hasComposed = !p.getComposedNotes().isEmpty();
        double totalComposedWeight = p.getComposedNotes().values().stream().mapToDouble(Double::doubleValue).sum();
        double totalLikedNotesWeight = p.getLikedNotes().values().stream().mapToInt(Integer::intValue).sum();
        double totalLikedAccordsWeight = p.getLikedAccords().values().stream().mapToInt(Integer::intValue).sum();
        double totalRecentNotesWeight = p.getRecentNotes().values().stream().mapToInt(Integer::intValue).sum();
        double totalRecentAccordsWeight = p.getRecentAccords().values().stream().mapToInt(Integer::intValue).sum();

        // season/dayNight: 가장 높은 값 1개만 사용 (이미 내림차순 정렬되어 있음)
        String topSeason = p.getLikedSeasons().isEmpty() ? null : p.getLikedSeasons().keySet().iterator().next();
        String topDayNight = p.getLikedDayNight().isEmpty() ? null : p.getLikedDayNight().keySet().iterator().next();

        record ScoredEntry(Map<String, Object> candidate, double composed, double liked, double search, double finalScore) {}

        // 4. 각 후보 향수 점수 계산
        List<ScoredEntry> scored = new ArrayList<>();

        for (Map<String, Object> candidate : bestByPerfume.values()) {
            Map<String, Object> payload = (Map<String, Object>) candidate.get("payload");
            Integer perfumeId = (Integer) payload.get("perfume_id");

            PerfumeEsDocument doc = esDocMap.get(perfumeId);
            if (doc == null) continue;

            Set<String> candidateNotes = doc.getNotes() == null ? Set.of() :
                    doc.getNotes().stream().map(n -> n.getName().toLowerCase()).collect(Collectors.toSet());
            Set<String> candidateAccords = doc.getAccords() == null ? Set.of() :
                    doc.getAccords().stream().map(a -> a.getName().toLowerCase()).collect(Collectors.toSet());
            String candidateSeason = doc.getSeason() != null ? doc.getSeason().getSeason() : null;
            String candidateDayNight = doc.getDayNight() != null ? doc.getDayNight().getDayNight() : null;

            // --- composedNotes score ---
            double composedScore = 0.0;
            if (hasComposed && totalComposedWeight > 0) {
                for (String note : candidateNotes) {
                    composedScore += p.getComposedNotes().getOrDefault(note, 0.0);
                }
                composedScore = Math.min(composedScore / totalComposedWeight, 1.0);
            }

            // --- liked score (notes 40% + accords 40% + season 10% + dayNight 10%) ---
            double likedNotesScore = 0.0;
            if (totalLikedNotesWeight > 0) {
                for (String note : candidateNotes) {
                    likedNotesScore += p.getLikedNotes().getOrDefault(note, 0);
                }
                likedNotesScore = Math.min(likedNotesScore / totalLikedNotesWeight, 1.0);
            }

            double likedAccordsScore = 0.0;
            if (totalLikedAccordsWeight > 0) {
                for (String accord : candidateAccords) {
                    likedAccordsScore += p.getLikedAccords().getOrDefault(accord, 0);
                }
                likedAccordsScore = Math.min(likedAccordsScore / totalLikedAccordsWeight, 1.0);
            }

            double likedSeasonScore = (topSeason != null && topSeason.equalsIgnoreCase(candidateSeason)) ? 1.0 : 0.0;
            double likedDayNightScore = (topDayNight != null && topDayNight.equalsIgnoreCase(candidateDayNight)) ? 1.0 : 0.0;

            double likedScore = likedNotesScore * 0.4
                    + likedAccordsScore * 0.4
                    + likedSeasonScore * 0.1
                    + likedDayNightScore * 0.1;

            // --- recentSearch score (notes 50% + accords 50%) ---
            double recentNotesScore = 0.0;
            if (totalRecentNotesWeight > 0) {
                for (String note : candidateNotes) {
                    recentNotesScore += p.getRecentNotes().getOrDefault(note, 0);
                }
                recentNotesScore = Math.min(recentNotesScore / totalRecentNotesWeight, 1.0);
            }

            double recentAccordsScore = 0.0;
            if (totalRecentAccordsWeight > 0) {
                for (String accord : candidateAccords) {
                    recentAccordsScore += p.getRecentAccords().getOrDefault(accord, 0);
                }
                recentAccordsScore = Math.min(recentAccordsScore / totalRecentAccordsWeight, 1.0);
            }

            double searchScore = recentNotesScore * 0.5 + recentAccordsScore * 0.5;

            // --- 최종 점수 ---
            double finalScore = hasComposed
                    ? composedScore * 0.5 + likedScore * 0.35 + searchScore * 0.15
                    : likedScore * 0.7 + searchScore * 0.3;

            scored.add(new ScoredEntry(candidate, composedScore, likedScore, searchScore, finalScore));
        }

        // 5. 전체 점수가 0이면 개인화 데이터 없음 → Qdrant score 순 상위 5개 fallback
        boolean allZero = scored.stream().allMatch(e -> e.finalScore() == 0.0);
        if (allZero) {
            log.info("[Scoring] 개인화 데이터 없음, Qdrant score 순 fallback");
            return candidates.stream().limit(5).collect(Collectors.toList());
        }

        // 6. 상위 5개 반환
        List<ScoredEntry> top5 = scored.stream()
                .sorted((a, b) -> Double.compare(b.finalScore(), a.finalScore()))
                .limit(5)
                .toList();

        top5.forEach(e -> {
            Map<String, Object> payload = (Map<String, Object>) e.candidate().get("payload");
            log.info("[Top5 WithScores] perfumeId={} composed={} liked={} search={} final={}",
                    payload.get("perfume_id"),
                    String.format("%.3f", e.composed()),
                    String.format("%.3f", e.liked()),
                    String.format("%.3f", e.search()),
                    String.format("%.3f", e.finalScore()));
        });

        return top5.stream().map(ScoredEntry::candidate).collect(Collectors.toList());      
    }

    private boolean isKorean(String text) {
        return text.chars().anyMatch(c -> c >= 0xAC00 && c <= 0xD7A3);
    }

    private String translateToEnglish(String text) {
        try {
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(new FileInputStream(credentialsPath))
                    .createScoped("https://www.googleapis.com/auth/cloud-translation");

            Translate translate = TranslateOptions.newBuilder()
                    .setCredentials(credentials)
                    .build()
                    .getService();

            Translation result = translate.translate(
                    text,
                    Translate.TranslateOption.sourceLanguage("ko"),
                    Translate.TranslateOption.targetLanguage("en")
            );
            return result.getTranslatedText();
        } catch (Exception e) {
            log.warn("[TempTranslationSearch] 번역 실패, 원문으로 검색: {}", e.getMessage());
            return text;
        }
    }



}
