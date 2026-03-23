package com.moodrop.scheduler;

import com.moodrop.entity.Perfumes;
import com.moodrop.repository.PerfumeBasicRepository;
import com.moodrop.repository.PerfumeLikeRankingRepository;
import com.moodrop.utils.RedisPerfumeKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

/**
 * 환경 변수 상 scheduler enabled 된 서버만 해당 스케줄러를 실행한다.
 * */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name="scheduler.enabled", havingValue="true")
public class PerfumeLikeRankingScheduler {

    private static final int TOP_RANKING_NUM = 50;
    private static final int DAYS_TO_SUBTRACT = 1;
    private final StringRedisTemplate redisTemplate;
    private final PerfumeBasicRepository perfumeBasicRepository;
    private final PerfumeLikeRankingRepository perfumeLikeRankingRepository;

    /**
     * 매일 자정 Redis의 향수 좋아요 ZSet을 읽어 perfume_like_ranking 테이블에 upsert.
     * stat_date는 전일 기준.
     */
    @Scheduled(cron = "${scheduler.perfume.like-batch-time}")
    public void syncLikeRanking() {
        LocalDate targetDate = LocalDate.now().minusDays(DAYS_TO_SUBTRACT);
        String dailyKey = RedisPerfumeKeys.perfumeLikeDailyRank(targetDate);

        Boolean exists = redisTemplate.hasKey(dailyKey);
        if (!Boolean.TRUE.equals(exists)) {
            log.info("[PerfumeLikeScheduler] 집계할 좋아요 키 없음. key={}", dailyKey);
            return;
        }

        Set<ZSetOperations.TypedTuple<String>> topPerfumes =
                redisTemplate.opsForZSet()
                        .reverseRangeWithScores(dailyKey, 0, TOP_RANKING_NUM - 1);

        if (topPerfumes == null || topPerfumes.isEmpty()) {
            log.info("[PerfumeLikeScheduler] 동기화할 좋아요 랭킹 데이터 없음");
            return;
        }

        int rank = 1;
        for (ZSetOperations.TypedTuple<String> tuple : topPerfumes) {
            if (tuple.getValue() == null || tuple.getScore() == null) {
                continue;
            }

            int perfumeId = Integer.parseInt(tuple.getValue());
            int dailyLikeCount = (int) Math.round(tuple.getScore());

            Optional<Perfumes> perfumeOpt = perfumeBasicRepository.findById(perfumeId);
            if (perfumeOpt.isEmpty()) {
                log.warn("[PerfumeLikeScheduler] perfumeId={} 를 DB에서 찾을 수 없어 건너뜀", perfumeId);
                continue;
            }

            String perfumeName = perfumeOpt.get().getName();

            try {
                perfumeLikeRankingRepository.upsertRanking(
                        perfumeId,
                        perfumeName,
                        rank,
                        dailyLikeCount,
                        targetDate
                );
            } catch (Exception e) {
                log.error("[PerfumeLikeScheduler] upsert 실패. perfumeId={}, rank={}", perfumeId, rank, e);
            }

            rank++;
        }

        redisTemplate.delete(dailyKey);
        log.info("[PerfumeLikeScheduler] 좋아요 랭킹 동기화 완료. date={}, 처리 건수={}", targetDate, topPerfumes.size());
    }

}
