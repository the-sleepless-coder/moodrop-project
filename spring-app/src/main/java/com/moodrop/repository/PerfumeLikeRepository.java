package com.moodrop.repository;

import com.moodrop.entity.PerfumeLike;
import com.moodrop.entity.PerfumeLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
