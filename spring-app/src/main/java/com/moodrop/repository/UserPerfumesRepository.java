package com.moodrop.repository;

import com.moodrop.entity.UserPerfumes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface UserPerfumesRepository extends JpaRepository<UserPerfumes, Integer> {

    // ── READ ──────────────────────────────────────────────────────────────────

    // [selectUserRecipe] userId(문자열)로 해당 유저의 모든 레시피 조회
    // user 테이블의 userId 컬럼 기준 (예: "json", "alice")
    @Query("SELECT up FROM UserPerfumes up JOIN FETCH up.user u WHERE u.userId = :userId")
    List<UserPerfumes> findAllByUserUserId(@Param("userId") String userId);

    // [selectRecipeById] recipeId로 단건 조회 (user FETCH JOIN → N+1 방지)
    @Query("""
            SELECT up FROM UserPerfumes up 
            JOIN FETCH up.user u 
            WHERE up.id = :recipeId
            """)
    Optional<UserPerfumes> findByIdWithUser(@Param("recipeId") Integer recipeId);

    // [selectRecipeAverageFromDb] 저장된 평균 별점 조회
    @Query("SELECT up.ratingAverage FROM UserPerfumes up WHERE up.id = :recipeId")
    Optional<Double> findRatingAverageById(@Param("recipeId") Integer recipeId);

    // ── UPDATE ────────────────────────────────────────────────────────────────

    // [updateUserRecipe] 이름·설명 수정
    @Modifying
    @Transactional
    @Query("UPDATE UserPerfumes up SET up.name = :name, up.description = :description WHERE up.id = :recipeId")
    int updateNameAndDescription(
            @Param("recipeId") Integer recipeId,
            @Param("name") String name,
            @Param("description") String description
    );

    // [updateRecipeAverage] 별점 평균 갱신
    @Modifying
    @Transactional
    @Query("UPDATE UserPerfumes up SET up.ratingAverage = :avg WHERE up.id = :recipeId")
    int updateRatingAverage(@Param("recipeId") Integer recipeId, @Param("avg") Double avg);

    // [like_count] 좋아요 수 1 증가
    @Modifying
    @Transactional
    @Query("""
    UPDATE UserPerfumes up
    SET up.likeCount = up.likeCount + 1
    WHERE up.id = :recipeId
    """)
    int incrementLikeCount(@Param("recipeId") Integer recipeId);

    // [like_count] 좋아요 수 1 감소 (0 미만 방지)
    @Modifying
    @Transactional
    @Query("""
    UPDATE UserPerfumes up
    SET up.likeCount = up.likeCount - 1
    WHERE up.id = :recipeId AND up.likeCount > 0
    """)
    int decrementLikeCount(@Param("recipeId") Integer recipeId);


    // viewCount 조회수를, delta값만큼 올려준다.
    // 쿨다운 정책 통과 시.
    @Modifying
    @Transactional
    @Query("""
        UPDATE UserPerfumes up 
        SET up.viewCount = up.viewCount + 1 
        WHERE up.id = :recipeId
    """
    )
    int incrementViewCountByDelta(@Param("recipeId") Integer recipeId, @Param("delta") Long delta);

}
