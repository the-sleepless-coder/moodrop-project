package com.moodrop.repository;

import com.moodrop.Enums.ImageType;
import com.moodrop.entity.PerfumeImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PerfumeImageRepository extends JpaRepository<PerfumeImage, Integer> {

    Optional<PerfumeImage> findByPerfumeIdAndImageType(Integer perfumeId, ImageType imageType);
}
