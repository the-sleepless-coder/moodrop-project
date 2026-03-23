package com.moodrop.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.moodrop.Enums.GenderType;
import com.moodrop.entity.Perfumes;
import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PerfumeDetailDto {

    private Integer id;
    private String name;
    private String brand;
    private RatingDto rating;
    private String description;

    @JsonProperty("description_ko")
    private String descriptionKo;

    private GenderType gender;
    private String country;
    private Integer year;

    private List<NoteDto> notes;
    private List<AccordDto> accords;

    @JsonProperty("comments_eng")
    private String commentsEng;

    @JsonProperty("comments_ko")
    private String commentsKo;

    @JsonProperty("day_night")
    private DayNightDto dayNight;

    private LongevityDto longevity;

    private SillageDto sillage;

    private SeasonDto season;


    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RatingDto {
        private Double value;
        private Integer count;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class NoteDto {
        private String name;
        private String type;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AccordDto {
        private String name;
        private Integer weight;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class DayNightDto {
        @JsonProperty("day_night")
        private String dayNight;
        private Integer weight;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LongevityDto {
        private String length;
        @JsonProperty("vote_num")
        private Integer voteNum;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SillageDto {
        private String strength;
        @JsonProperty("vote_num")
        private Integer voteNum;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SeasonDto {
        private String season;
        private Integer weight;
    }
}
