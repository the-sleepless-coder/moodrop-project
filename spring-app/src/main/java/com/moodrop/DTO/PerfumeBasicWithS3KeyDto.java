package com.moodrop.DTO;

import com.moodrop.Enums.GenderType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PerfumeBasicWithS3KeyDto {

    private String name;

    private String brandName;

    private String country;

    private Double ratingVal;

    private Integer ratingCount;

    private List<String> perfumeComment;

    private String perfumeLongevity;

    private Integer perfumeLongevityVotes;

    private String perfumeSillage;

    private Integer perfumeSillageVotes;

    private String season;

    private Integer seasonWeight;

    private String perfumeDayNight;

    private Integer perfumeDayNightWeight;

    private String description;

    private Integer year;

    private GenderType genderType;

    private String descriptionKo;

    private String s3Key;
}


