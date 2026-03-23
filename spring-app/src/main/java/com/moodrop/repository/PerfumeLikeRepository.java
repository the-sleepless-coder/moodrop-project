package com.moodrop.repository;

import com.moodrop.entity.PerfumeLike;
import com.moodrop.entity.PerfumeLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerfumeLikeRepository extends JpaRepository<PerfumeLike, PerfumeLikeId> {

    boolean existsById(PerfumeLikeId id);

    // 좋아요 (중복 방지 upsert)
    @Modifying
    @Query(value = "INSERT IGNORE INTO perfume_like (user_id, perfume_id) VALUES (:userId, :perfumeId)",
           nativeQuery = true)
    int like(@Param("userId") Integer userId, @Param("perfumeId") Integer perfumeId);

    // 좋아요 취소
    @Modifying
    @Query("DELETE FROM PerfumeLike pl WHERE pl.id.userId = :userId AND pl.id.perfumeId = :perfumeId")
    int unlike(@Param("userId") Integer userId, @Param("perfumeId") Integer perfumeId);

    // 사용자가 좋아요 누른 향수 ID 목록 (최대 20개)
    @Query("SELECT pl.id.perfumeId FROM PerfumeLike pl WHERE pl.id.userId = :userId")
    List<Integer> findLikedPerfumeIdsByUserId(@Param("userId") Integer userId, Pageable pageable);
}
