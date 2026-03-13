package com.moodrop.scheduler;

import com.moodrop.repository.UserPerfumesLikeRankingRepository;
import com.moodrop.repository.UserPerfumesRepository;
import com.moodrop.entity.UserPerfumes;
import com.moodrop.utils.RedisRecipeKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecipeLikeScheduler {

    private static final int TOP_RANKING_NUM = 50;

    private final StringRedisTemplate redisTemplate;
    private final UserPerfumesRepository userPerfumesRepository;
    private final UserPerfumesLikeRankingRepository likeRankingRepository;

    /**
     * 매일 자정 Redis의 좋아요 ZSet을 읽어 user_perfumes_like_ranking 테이블에 upsert.
     * 분산 락으로 다중 서버 중복 실행 방지.
     *
     * 전일 랭킹 및 좋아요 수 업데이트
     */
    @Scheduled(cron = "0 1 0 * * *")
    public void syncLikeRanking() {
        String lockKey   = RedisRecipeKeys.RECIPE_LIKE_SYNC_LOCK;
        String lockValue = UUID.randomUUID().toString();

        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, 60, TimeUnit.SECONDS);

        if (!Boolean.TRUE.equals(locked)) {
            return;
        }

        try {
            LocalDate targetDate = LocalDate.now().minusDays(1);
            String dailyKey = RedisRecipeKeys.recipeLikeDailyRank(targetDate);
            String processingKey = RedisRecipeKeys.recipeLikeDailyProcessing(targetDate);

            Boolean exists = redisTemplate.hasKey(dailyKey);
            if (!Boolean.TRUE.equals(exists)) {
                log.info("[RecipeLikeScheduler] 집계할 좋아요 키 없음. key={}", dailyKey);
                return;
            }


            // 어제 집계 키를 processing 키로 변경
            redisTemplate.rename(dailyKey, processingKey);

            Set<ZSetOperations.TypedTuple<String>> topRecipes =
                    redisTemplate.opsForZSet()
                            .reverseRangeWithScores(processingKey, 0, TOP_RANKING_NUM - 1);

            if (topRecipes == null || topRecipes.isEmpty()) {
                log.info("[RecipeLikeScheduler] 동기화할 좋아요 랭킹 데이터 없음");
                return;
            }

            int rank = 1;
            for (ZSetOperations.TypedTuple<String> tuple : topRecipes) {
                if (tuple.getValue() == null || tuple.getScore() == null) {
                    continue;
                }

                int recipeId = Integer.parseInt(tuple.getValue());
                int dailyLikeCount = (int) Math.round(tuple.getScore());

                Optional<UserPerfumes> recipeOpt = userPerfumesRepository.findById(recipeId);
                if (recipeOpt.isEmpty()) {
                    log.warn("[RecipeLikeScheduler] recipeId={} 를 DB에서 찾을 수 없어 건너뜀", recipeId);
                    continue;
                }

                String recipeName = recipeOpt.get().getName();

                try {
                    likeRankingRepository.upsertRanking(
                            recipeId,
                            recipeName,
                            rank,
                            dailyLikeCount,
                            targetDate
                    );
                } catch (Exception e) {
                    log.error("[RecipeLikeScheduler] upsert 실패. recipeId={}, rank={}", recipeId, rank, e);
                }

                rank++;
            }

            redisTemplate.delete(processingKey);
            log.info("[RecipeLikeScheduler] 좋아요 랭킹 동기화 완료. date={}, 처리 건수={}", targetDate, topRecipes.size());

        } finally {
            releaseLockSafely(lockKey, lockValue);
        }
    }

    private void releaseLockSafely(String lockKey, String lockValue) {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText("""
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end
        """);
        script.setResultType(Long.class);
        redisTemplate.execute(script, Collections.singletonList(lockKey), lockValue);
    }

}
