package com.moodrop.utils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class RedisRecipeKeys {

    // private하게 만들어서 해당 클래스에서만 생성 가능하게 함.
    private RedisRecipeKeys(){
    }

    // recipe 조회 수
    public static final String RECIPE_SYNC_LOCK = "recipe:lock";
    public static final String RECIPE_VIEWED_SET = "recipe:viewedSet";
    public static final String RECIPE_VIEWED_PROCESSING_SET = "recipe:viewedSet:processing";
    public static final String RECIPE_FLUSH_FAILED= "recipe:flushFailed";

    public static String recipeCoolDown(String userId, int recipeId){
        return "recipe:coolDown:"+ recipeId + ":" + userId;
    }

    public static String recipeCount(int recipeId){
        return "recipe:count:" + recipeId;
    }

    public static String recipeDailyRank(LocalDate date) {
        return "recipe:rank:daily:" + date;
    }

    // recipe 좋아요 수
    public static final String RECIPE_LIKE_SYNC_LOCK = "recipe:like:lock";
    public static final String RECIPE_LIKED_SET  = "recipe:likedSet";

    public static String recipeLikeDailyRank(LocalDate date) {
        return "recipe:like:daily:" + date.format(DateTimeFormatter.BASIC_ISO_DATE);
    }

    public static String recipeLikeDailyProcessing(LocalDate date) {
        return "recipe:like:daily:processing:" + date.format(DateTimeFormatter.BASIC_ISO_DATE);
    }

}
