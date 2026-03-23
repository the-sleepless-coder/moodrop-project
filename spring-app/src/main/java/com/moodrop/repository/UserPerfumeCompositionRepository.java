package com.moodrop.repository;

import com.moodrop.entity.UserPerfumeComposition;
import com.moodrop.entity.UserPerfumeCompositionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserPerfumeCompositionRepository extends JpaRepository<UserPerfumeComposition, UserPerfumeCompositionId> {

    @Query("""
            SELECT upc
            FROM UserPerfumeComposition upc
            JOIN FETCH upc.note
            WHERE upc.userPerfume.user.id = :userId
            """)
    List<UserPerfumeComposition> findByUserId(@Param("userId") Integer userId);
}
