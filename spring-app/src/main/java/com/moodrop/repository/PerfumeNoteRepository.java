package com.moodrop.repository;

import com.moodrop.entity.PerfumeNote;
import com.moodrop.entity.PerfumeNoteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerfumeNoteRepository extends JpaRepository<PerfumeNote, PerfumeNoteId> {

    @Query("""
            SELECT pn 
            FROM PerfumeNote pn 
            JOIN FETCH pn.note 
            WHERE pn.perfumeId = :perfumeId
            """)
    List<PerfumeNote> findByPerfumeId(@Param("perfumeId") Integer perfumeId);
}
