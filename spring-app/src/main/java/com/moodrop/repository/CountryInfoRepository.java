package com.moodrop.repository;

import com.moodrop.entity.CountryInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CountryInfoRepository extends JpaRepository<CountryInfo, Integer> {
    Optional<CountryInfo> findByCountry(String country);
}
