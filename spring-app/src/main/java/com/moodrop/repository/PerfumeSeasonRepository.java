package com.moodrop.repository;

import com.moodrop.entity.PerfumeSeason;
import com.moodrop.entity.PerfumeSeasonId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerfumeSeasonRepository extends JpaRepository<PerfumeSeason, PerfumeSeasonId> {

    @Query("""
            SELECT ps
            FROM PerfumeSeason ps
            WHERE ps.perfumeId = :perfumeId
            ORDER BY ps.weight DESC""")
    List<PerfumeSeason> findTopByPerfumeId(@Param("perfumeId") Integer perfumeId, Pageable pageable);

    @Query("""
            SELECT ps
            FROM PerfumeSeason ps
            WHERE ps.perfumeId IN :perfumeIds
            """)
    List<PerfumeSeason> findByPerfumeIds(@Param("perfumeIds") List<Integer> perfumeIds);
}
