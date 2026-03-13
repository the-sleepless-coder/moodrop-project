package com.moodrop.repository;

import com.moodrop.entity.LongevityInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LongevityInfoRepository extends JpaRepository<LongevityInfo, Integer> {
    Optional<LongevityInfo> findByLength(String length);
}
