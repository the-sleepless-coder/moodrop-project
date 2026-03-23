package com.moodrop.repository;

import com.moodrop.entity.PerfumeSillage;
import com.moodrop.entity.PerfumeSillageId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerfumeSillageRepository extends JpaRepository<PerfumeSillage, PerfumeSillageId> {

    @Query("""
            SELECT ps FROM PerfumeSillage ps
            JOIN FETCH ps.sillageInfo
            WHERE ps.perfumeId = :perfumeId
            ORDER BY ps.voteNum DESC
            """)
    List<PerfumeSillage> findTopByPerfumeId(@Param("perfumeId") Integer perfumeId, Pageable pageable);
}
