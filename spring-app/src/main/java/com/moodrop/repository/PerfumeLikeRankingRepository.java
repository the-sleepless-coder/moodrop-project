package com.moodrop.repository;

import com.moodrop.entity.PerfumeLikeRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

public interface PerfumeLikeRankingRepository extends JpaRepository<PerfumeLikeRanking, Integer> {

    // perfume_id에 unique 제약이 있으므로,
    // 없으면 INSERT, 있으면 UPDATE (ranking, like_count, perfume_name, updated_at 갱신)
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO perfume_like_ranking (perfume_id, perfume_name, daily_ranking, daily_like_count, stat_date, updated_at)
        VALUES (:perfumeId, :perfumeName, :ranking, :likeCount, :statDate, NOW())
        ON DUPLICATE KEY UPDATE
            perfume_name      = VALUES(perfume_name),
            daily_ranking     = VALUES(daily_ranking),
            daily_like_count  = VALUES(daily_like_count),
            stat_date         = VALUES(stat_date),
            updated_at        = NOW()
    """, nativeQuery = true)
    void upsertRanking(
            @Param("perfumeId")   Integer perfumeId,
            @Param("perfumeName") String  perfumeName,
            @Param("ranking")     Integer ranking,
            @Param("likeCount")   Integer likeCount,
            @Param("statDate")    LocalDate statDate
    );

}
