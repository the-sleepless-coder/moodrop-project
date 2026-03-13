package com.moodrop.repository;

import com.moodrop.entity.PerfumeMainAccord;
import com.moodrop.entity.PerfumeMainAccordId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerfumeMainAccordRepository extends JpaRepository<PerfumeMainAccord, PerfumeMainAccordId> {

    @Query("""
            SELECT pma 
            FROM PerfumeMainAccord pma 
            JOIN FETCH pma.accord 
            WHERE pma.perfumeId = :perfumeId
            """)
    List<PerfumeMainAccord> findByPerfumeId(@Param("perfumeId") Integer perfumeId);
}
