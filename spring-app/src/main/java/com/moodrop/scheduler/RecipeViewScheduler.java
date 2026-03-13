package com.moodrop.scheduler;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import com.moodrop.repository.UserPerfumesRepository;
import com.moodrop.utils.RedisRecipeKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecipeViewScheduler {

    private final StringRedisTemplate redisTemplate;
    private final UserPerfumesRepository userPerfumesRepository;

    @Scheduled(fixedDelayString = "${scheduler.recipe.view-sync-delay}")
    public void syncViewedCounts(){
        String lockKey = RedisRecipeKeys.RECIPE_SYNC_LOCK;
        String lockValue = UUID.randomUUID().toString();

        // 락이 없으면 생성하고 내가 락을 잡는다.
        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, 10, TimeUnit.SECONDS);

        // 이미 키가 존재해서 락이 잡혀 있으면,
        // 해당 서버는 작업을 처리하지 않는다.
        if(!Boolean.TRUE.equals(locked)){
            return;
        }

        String viewedSetKey = RedisRecipeKeys.RECIPE_VIEWED_SET;
        String processingSetKey = RedisRecipeKeys.RECIPE_VIEWED_PROCESSING_SET;

        boolean noRecipesToFlush = false;
        boolean dbFlushCompleted = false;

        try{
            // source 키가 없으면 RENAMENX가 "ERR no such key"를 던지므로 먼저 확인
            if (!Boolean.TRUE.equals(redisTemplate.hasKey(viewedSetKey))) {
                noRecipesToFlush = true;
                // log.info("No views to update");
                return;
            }

            // 스케줄러가 처리할 수 있게, 5초 동안 형성된 viewedSetKey의 이름을 바꿔준다.
            Boolean renamed = redisTemplate.renameIfAbsent(viewedSetKey, processingSetKey);
            if (Boolean.FALSE.equals(renamed)) {
                return;
            }

            // 스케줄러가 처리할 키들을 Set에 담아서 처리한다.
            Set<String> recipeIds = redisTemplate.opsForSet().members(processingSetKey);
            if(recipeIds == null||recipeIds.isEmpty()){
                noRecipesToFlush = true;
                return;
            }

            for(String recipeIdStr:recipeIds){
                // 데이터 타입 문제 발생에 따른 예외 처리.
                int recipeId;
                try{
                    recipeId = Integer.parseInt(recipeIdStr);
                }catch(NumberFormatException e){
                    continue;
                }

                String countKey = RedisRecipeKeys.recipeCount(recipeId);

                String deltaStr = redisTemplate.opsForValue().getAndSet(countKey, "0");
                redisTemplate.expire(countKey, 15, TimeUnit.SECONDS);

                if(deltaStr==null)
                    continue;

                long delta;
                try{
                    delta = Long.parseLong(deltaStr);
                }catch(NumberFormatException e){
                    continue;
                }

                // DB 반영 실패 시, 로그로 기록한다.
                // 최근 기록부터 확인할 수 있게 ZSET에 기록한다.
                if(delta>0){
                    try{
                        userPerfumesRepository.incrementViewCountByDelta(
                                recipeId,
                                delta);
                    }catch(DataAccessException e){
                        long now = System.currentTimeMillis();
                        redisTemplate.opsForZSet().add(RedisRecipeKeys.RECIPE_FLUSH_FAILED, String.valueOf(recipeId), now);

                        LocalDateTime failedTime = Instant.ofEpochMilli(now)
                                        .atZone(ZoneId.of("Asia/Seoul"))
                                        .toLocalDateTime();
                        log.error("DB flush failed. recipeId={}, time={}", recipeId, failedTime, e);
                    }

                }
            }

            dbFlushCompleted = true;
        }
        finally{
            if(dbFlushCompleted || noRecipesToFlush){
                // 처리를 완료한 Set은 삭제한다.
                redisTemplate.delete(processingSetKey);
            }

            // 서버가 작업 처리를 완료 했다면,
            // Lua script를 활용해 락을 해제해준다.
            releaseLockSafely(lockKey, lockValue);
        }


    }

    // Lua Script를 활용해서 잡혀 있던 락을 안전하게 해제해준다.
    private void releaseLockSafely(String lockKey, String lockValue){
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
