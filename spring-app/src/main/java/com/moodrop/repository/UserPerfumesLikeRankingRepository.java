package com.moodrop.repository;

import com.moodrop.entity.UserPerfumesLikeRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

public interface UserPerfumesLikeRankingRepository extends JpaRepository<UserPerfumesLikeRanking, Integer> {

    // recipe_id에 unique 제약이 있으므로,
    // 없으면 INSERT, 있으면 UPDATE (ranking, like_count, recipe_name, updated_at 갱신)
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO user_perfumes_like_ranking (recipe_id, recipe_name, daily_ranking, daily_like_count, stat_date,updated_at)
        VALUES (:recipeId, :recipeName, :ranking, :likeCount, :statDate ,NOW())
        ON DUPLICATE KEY UPDATE
            recipe_name = VALUES(recipe_name),
            ranking     = VALUES(ranking),
            like_count  = VALUES(like_count),
            updated_at  = NOW()
    """, nativeQuery = true)
    void upsertRanking(
            @Param("recipeId")   Integer recipeId,
            @Param("recipeName") String  recipeName,
            @Param("ranking")    Integer ranking,
            @Param("likeCount")  Integer likeCount,
            @Param("statDate") LocalDate statDate
    );

}
