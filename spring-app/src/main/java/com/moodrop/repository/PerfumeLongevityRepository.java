package com.moodrop.repository;

import com.moodrop.entity.PerfumeLongevity;
import com.moodrop.entity.PerfumeLongevityId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerfumeLongevityRepository extends JpaRepository<PerfumeLongevity, PerfumeLongevityId> {

    @Query("""
            SELECT pl FROM PerfumeLongevity pl
            JOIN FETCH pl.longevityInfo
            WHERE pl.perfumeId = :perfumeId
            ORDER BY pl.voteNum DESC
            """)
    List<PerfumeLongevity> findTopByPerfumeId(@Param("perfumeId") Integer perfumeId, Pageable pageable);
}
