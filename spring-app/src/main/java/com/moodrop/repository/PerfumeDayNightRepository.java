package com.moodrop.repository;

import com.moodrop.entity.PerfumeDayNight;
import com.moodrop.entity.PerfumeDayNightId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerfumeDayNightRepository extends JpaRepository<PerfumeDayNight, PerfumeDayNightId> {

    @Query("""
            SELECT pdn 
            FROM PerfumeDayNight pdn 
            WHERE pdn.perfumeId = :perfumeId 
            ORDER BY pdn.weight DESC""")
    List<PerfumeDayNight> findTopByPerfumeId(@Param("perfumeId") Integer perfumeId, Pageable pageable);
}
