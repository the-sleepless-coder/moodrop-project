package com.moodrop.repository;

import com.moodrop.entity.BrandInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BrandInfoRepository extends JpaRepository<BrandInfo, Integer> {
    Optional<BrandInfo> findByName(String name);
}
