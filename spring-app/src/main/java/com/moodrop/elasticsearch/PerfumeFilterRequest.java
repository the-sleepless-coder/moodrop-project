package com.moodrop.elasticsearch;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class PerfumeFilterRequest {

    private String name;           // 이름 (부분 일치)
    private String brand;          // 브랜드명
    private Double ratingMin;      // 평점 최솟값
    private Double ratingMax;      // 평점 최댓값
    private String gender;         // 남/여 (MALE | FEMALE | UNISEX)
    private String country;        // 국가
    private Integer year;          // 연도
    private String season;         // 계절 (spring | summer | fall | winter)
    private String dayNight;       // 낮/밤 (day | night)
    private String sillage;        // 세기 (soft | moderate | strong | enormous)
    private String longevity;      // 지속성 (poor | weak | moderate | long lasting | eternal)
    private List<String> accords;  // 주요 향조 (AND 조건 - 모두 포함)
    private List<String> notes;    // 특정 노트 (AND 조건 - 모두 포함)

    // 코멘트/설명 텍스트 검색과 조합 (선택)
    private String language;       // KO | ENG
    private String textType;       // comment | description
    private String textQuery;      // 검색어
}
