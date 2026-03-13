package com.moodrop.elasticsearch;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;

//static String indexName = ;

@Document(indexName ="#{@environment.getProperty('app.es.index.perfume')}")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PerfumeEsDocument {

    @Id
    private Integer id;

    @Field(type = FieldType.Search_As_You_Type)
    private String name;

    @Field(type = FieldType.Keyword)
    private String brand;

    @Field(type = FieldType.Keyword)
    private String gender;

    @Field(type = FieldType.Keyword)
    private String country;

    private Integer year;

    @Field(type = FieldType.Object)
    private RatingDoc rating;

    @Field(type = FieldType.Text)
    private String description;

    @Field(name = "description_ko", type = FieldType.Text)
    private String descriptionKo;

    @Field(type = FieldType.Nested)
    private List<NoteDoc> notes;

    @Field(type = FieldType.Nested)
    private List<AccordDoc> accords;

    @Field(type = FieldType.Object)
    private DayNightDoc dayNight;

    @Field(type = FieldType.Object)
    private LongevityDoc longevity;

    @Field(type = FieldType.Object)
    private SillageDoc sillage;

    @Field(type = FieldType.Object)
    private SeasonDoc season;

    @Field(name = "comments_eng", type = FieldType.Text)
    private String commentsEng;

    @Field(name = "comments_ko", type = FieldType.Text)
    private String commentsKo;


    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RatingDoc {
        private Double value;
        private Integer count;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class NoteDoc {
        private String name;
        private String type;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AccordDoc {
        private String name;
        private Integer weight;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class DayNightDoc {
        @Field(name = "day_night")
        private String dayNight;
        private Integer weight;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LongevityDoc {
        private String length;
        @Field(name = "vote_num")
        private Integer voteNum;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SillageDoc {
        private String strength;
        @Field(name = "vote_num")
        private Integer voteNum;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SeasonDoc {
        private String season;
        private Integer weight;
    }
}
