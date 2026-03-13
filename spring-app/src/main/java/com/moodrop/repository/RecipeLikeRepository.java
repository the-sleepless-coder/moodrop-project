package com.moodrop.repository;

import com.moodrop.entity.RecipeLike;
import com.moodrop.entity.RecipeLikeId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeLikeRepository extends JpaRepository<RecipeLike, RecipeLikeId> {
}
