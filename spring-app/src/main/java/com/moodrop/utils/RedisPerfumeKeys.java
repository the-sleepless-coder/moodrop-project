package com.moodrop.utils;

import java.time.LocalDate;

public final class RedisPerfumeKeys {
    private RedisPerfumeKeys(){};

    public static final String PERFUME_SYNC_LOCK = "perfume:lock";
    public static final String PERFUME_VIEWED_SET = "perfume:viewedSet";
    public static final String PERFUME_VIEWED_PROCESSING_SET = "perfume:viewedSet:processing";
    public static final String PERFUME_FLUSH_FAILED= "perfume:flushFailed";

    public static String perfumeLikeDailyRank(LocalDate date) {
        return "perfume:like:daily:" + date;
    }

    // 사용자 별 검색한 향수 기록
    public static String usersRecentlySearchedPerfumes(int userId){
        return "user:search:perfume:"+userId;
    }

    // 사용자별 향수를 검색한 횟수.
    public static String userPerfumeSearchCountKey(Integer userId) {
        return "user:search:perfume:count:" + userId;
    }

    // 일별 인기 향수 랭킹 기록.
    public static String dailySearchedPerfumesRanking(LocalDate date){
        return "perfume:searched:daily:"+date;
    }
}
