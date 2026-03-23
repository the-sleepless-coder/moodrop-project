package com.moodrop.service;

import com.moodrop.DTO.UserPersonalizationDto;
import com.moodrop.elasticsearch.PerfumeEsDocument;
import com.moodrop.elasticsearch.PerfumeEsRepository;
import com.moodrop.repository.*;
import com.moodrop.utils.RedisPerfumeKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserPersonalizationService {

    private final UserRepository userRepository;
    private final PerfumeLikeRepository perfumeLikeRepository;
    private final PerfumeNoteRepository perfumeNoteRepository;
    private final PerfumeMainAccordRepository perfumeMainAccordRepository;
    private final PerfumeSeasonRepository perfumeSeasonRepository;
    private final PerfumeDayNightRepository perfumeDayNightRepository;
    private final UserPerfumeCompositionRepository userPerfumeCompositionRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final PerfumeEsRepository perfumeEsRepository;

    public UserPersonalizationDto fetch(String userIdStr) {
        Integer userId = userRepository.findIdByUserIdStr(userIdStr).orElse(null);
        if (userId == null) {
            log.warn("[Personalization] 존재하지 않는 userId={}", userIdStr);
            return new UserPersonalizationDto(Map.of(), Map.of(), Map.of(), Map.of(), Map.of(), List.of(), Map.of(), Map.of());
        }

        // --- RDB: 좋아요 누른 향수 ID (최대 20개) ---
        List<Integer> likedIds = perfumeLikeRepository.findLikedPerfumeIdsByUserId(userId, PageRequest.of(0, 20));

        Map<String, Integer> likedNotes = new HashMap<>();
        Map<String, Integer> likedAccords = new HashMap<>();
        Map<String, Double> likedSeasons = new HashMap<>();
        Map<String, Double> likedDayNight = new HashMap<>();

        if (!likedIds.isEmpty()) {
            perfumeNoteRepository.findByPerfumeIds(likedIds)
                    .forEach(pn -> likedNotes.merge(pn.getNote().getName(), 1, Integer::sum));

            perfumeMainAccordRepository.findByPerfumeIds(likedIds)
                    .forEach(pma -> likedAccords.merge(pma.getAccord().getName(), 1, Integer::sum));

            perfumeSeasonRepository.findByPerfumeIds(likedIds)
                    .forEach(ps -> likedSeasons.merge(ps.getSeason(), ps.getWeight() / 100.0, Double::sum));

            perfumeDayNightRepository.findByPerfumeIds(likedIds)
                    .forEach(pdn -> likedDayNight.merge(pdn.getDayNight(), pdn.getWeight() / 100.0, Double::sum));
        }

        // --- RDB: 사용자 제조 향수 노트 ---
        Map<String, Double> composedNotes = new HashMap<>();
        userPerfumeCompositionRepository.findByUserId(userId)
                .forEach(upc -> composedNotes.merge(upc.getNote().getName(), upc.getWeight() / 100.0, Double::sum));

        // --- Redis: 최근 검색한 향수 ID (최대 20개, 최신순) ---
        String redisKey = RedisPerfumeKeys.usersRecentlySearchedPerfumes(userId);
        Set<String> raw = redisTemplate.opsForZSet().reverseRange(redisKey, 0, 19);
        List<Integer> recentSearchIds = raw == null ? List.of() :
                raw.stream().map(Integer::parseInt).collect(Collectors.toList());

        // --- ES: 최근 검색 향수 10개 기준 notes/accords 집계 ---
        Map<String, Integer> recentNotes = new HashMap<>();
        Map<String, Integer> recentAccords = new HashMap<>();
        List<Integer> top10Recent = recentSearchIds.stream().limit(10).collect(Collectors.toList());
        if (!top10Recent.isEmpty()) {
            perfumeNoteRepository.findByPerfumeIds(top10Recent)
                    .forEach(pn -> recentNotes.merge(pn.getNote().getName(), 1, Integer::sum));
            perfumeMainAccordRepository.findByPerfumeIds(top10Recent)
                    .forEach(pma -> recentAccords.merge(pma.getAccord().getName(), 1, Integer::sum));
        }

        log.info("[Personalization] userId={} likedPerfumes={} notes={} accords={} seasons={} dayNight={} composedNotes={} recentSearches={} recentNotes={} recentAccords={}",
                userIdStr, likedIds.size(), likedNotes.size(), likedAccords.size(),
                likedSeasons.size(), likedDayNight.size(), composedNotes.size(), recentSearchIds.size(),
                recentNotes.size(), recentAccords.size());

        return new UserPersonalizationDto(
                sortDescInt(likedNotes, 15),
                sortDescInt(likedAccords, 15),
                sortDescDouble(likedSeasons),
                sortDescDouble(likedDayNight),
                sortDescDouble(composedNotes, 15),
                recentSearchIds,
                sortDescInt(recentNotes, 15),
                sortDescInt(recentAccords, 15)
        );
    }

    private Map<String, Integer> sortDescInt(Map<String, Integer> map, int limit) {
        return map.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    private Map<String, Double> sortDescDouble(Map<String, Double> map) {
        return map.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> Math.round(e.getValue() * 100.0) / 100.0,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    private Map<String, Double> sortDescDouble(Map<String, Double> map, int limit) {
        return map.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> Math.round(e.getValue() * 100.0) / 100.0,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }
}
