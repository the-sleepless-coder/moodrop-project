package com.moodrop.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@AllArgsConstructor
public class UserPersonalizationDto {
    private Map<String, Integer> likedNotes;     // note명 → 등장 횟수 (내림차순)
    private Map<String, Integer> likedAccords;   // accord명 → 등장 횟수 (내림차순)
    private Map<String, Double> likedSeasons;    // season → weight/100 합산 (내림차순)
    private Map<String, Double> likedDayNight;   // day/night → weight/100 합산 (내림차순)
    private Map<String, Double> composedNotes;   // 사용자 제조 향수 note명 → weight/100 합산 (내림차순)
    private List<Integer> recentSearchIds;
    private Map<String, Integer> recentNotes;    // 최근 검색 향수 10개 기준 note 등장 횟수
    private Map<String, Integer> recentAccords;  // 최근 검색 향수 10개 기준 accord 등장 횟수
}
