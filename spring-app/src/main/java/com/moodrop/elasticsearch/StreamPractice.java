package com.moodrop.elasticsearch;

import java.util.*;
import java.util.stream.*;

public class StreamPractice {
    public static void main(String[] args) {

        PerfumeEsDocument doc1 = new PerfumeEsDocument(
                1L,
                "Bleu de Chanel",
                "Chanel",
                new RatingDto(4.5, 1200)
        );

        PerfumeEsDocument doc2 = new PerfumeEsDocument(
                2L,
                "Bleu Noir",
                "Narciso Rodriguez",
                new RatingDto(4.2, 800)
        );

        
        
        List<SearchHit<PerfumeEsDocument>> hits = new ArrayList<>();
        
        hits.add(new SearchHit<>(doc1));
        hits.add(new SearchHit<>(doc2));
        
        /**
        for(SearchHit<PerfumeEsDocument> hit:hits){
            System.out.println(hit.getContent());
        }
        */
        
        // SearchHit 클래스에서 ESDocument의 데이터 추출 
        // 추출한 데이터로 DTO 설정
        // 만든 DTO를 List로 추출한다.
        List<AutoCompleteDTO> result = 
        hits.stream()
        .map(SearchHit::getContent)
        .map(doc -> new AutoCompleteDTO(
            doc.getId(), 
            doc.getBrand(), 
            doc.getName(),
            doc.getRating()!=null ? doc.getRating(): null
            ))
        .collect(Collectors.toList());
        
        // 결국 Document/SQL 형태로 돼 있는 데이터를,
        // DTO로 변환해서 응답으로 바꾼 셈이다.
        for(AutoCompleteDTO data: result){
            System.out.println(data);
        }
        
    }


    /* ===== PerfumeEsDocument 클래스 정의 ===== */
    static class PerfumeEsDocument {

        private Long id;
        private String name;
        private String brand;
        private RatingDto rating;

        public PerfumeEsDocument(Long id, String name, String brand, RatingDto rating) {
            this.id = id;
            this.name = name;
            this.brand = brand;
            this.rating = rating;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getBrand() { return brand; }
        public RatingDto getRating() { return rating; }

        @Override
        public String toString() {
            return "PerfumeEsDocument{" +
                    "id=" + id +
                    ", name='" + name + '\'' +
                    ", brand='" + brand + '\'' +
                    ", rating=" + rating +
                    '}';
        }
    }

    /* ===== RatingDto 클래스 정의 ===== */

    static class RatingDto {

        private Double value;
        private Integer count;

        public RatingDto(Double value, Integer count) {
            this.value = value;
            this.count = count;
        }

        public Double getValue() { return value; }
        public Integer getCount() { return count; }

        @Override
        public String toString() {
            return "RatingDto{" +
                    "value=" + value +
                    ", count=" + count +
                    '}';
        }
    }


    /**
     * SearchHit 클래스 구현
     * Generic 클래스를 구현하면,
     * 어떠한 형태의 자료구조이든 올 수 있게 만들 수 있다.
     * 컴파일 타임에 타입을 검사하면서,
     * 런타임에서 오류가 나지 않도록 한다.
     * */
    static class SearchHit<T>{
        private T content;

        public SearchHit(T content){
            this.content = content;
        }

        // SearchHit에 대한 내용을 가져온다.
        public T getContent(){
            return content;
        }


    }

    // Autocomplete에 대한 결과를 보여주는 DTO를 만들어준다.
    static class AutoCompleteDTO{
        long Id;
        String name;
        String brand;
        RatingDto rating;

        public AutoCompleteDTO(long Id, String name, String brand, RatingDto rating){
            this.Id = Id;
            this.name = name;
            this.brand = brand;
            this.rating = rating;
        }

        @Override
        public String toString(){
            return "AutoCompleteDto{" +
                    "Id=" + Id +
                    ", name=" + name +
                    ", brand=" + brand +
                    ", rating" + rating +
                    '}';

        }

    }



}

