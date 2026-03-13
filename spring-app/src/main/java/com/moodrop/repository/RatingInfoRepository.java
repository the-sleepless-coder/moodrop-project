package com.moodrop.repository;

import com.moodrop.entity.RatingInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RatingInfoRepository extends JpaRepository<RatingInfo, Integer> {
}
