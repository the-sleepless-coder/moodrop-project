package com.moodrop.model.repository;

import com.moodrop.model.domain.MfRecipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MfRecipeRepository extends JpaRepository<MfRecipe, Long> {
    @Query("SELECT e.ingredientId FROM MfRecipe e WHERE e.jobId = :targetId")
    List<Long> findAllIngredientIdsByJobId(@Param("targetId") Long targetId);

    List<MfRecipe> findAllByJobId(Long jobId);
}