package com.moodrop.repository;

import com.moodrop.entity.CommentInfo;
import com.moodrop.entity.PerfumeComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface PerfumeCommentRepository extends JpaRepository<PerfumeComment, Long> {
    // perfumeId를 활용한 댓글 찾기.

    @Query(
        """
        select ci.comment
        from PerfumeComment pc
        join pc.comment ci
        where pc.perfume.id = :perfumeId
        """
    )
    List<String> findCommentString(@Param("perfumeId") Long perfumeId);

    @Query(
        """
        select ci.commentKo
        from PerfumeComment pc
        join pc.comment ci
        where pc.perfume.id = :perfumeId
        """
    )
    List<String> findCommentKoString(@Param("perfumeId") Long perfumeId);

    @Query(
        """
        select ci
        from PerfumeComment pc
        join pc.comment ci
        where pc.perfume.id = :perfumeId
        """
    )
    List<CommentInfo> findCommentInfosByPerfumeId(@Param("perfumeId") Integer perfumeId);

}