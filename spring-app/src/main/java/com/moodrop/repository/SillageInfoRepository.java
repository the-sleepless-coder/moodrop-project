package com.moodrop.repository;

import com.moodrop.entity.SillageInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SillageInfoRepository extends JpaRepository<SillageInfo, Integer> {
    Optional<SillageInfo> findByStrength(String strength);
}
