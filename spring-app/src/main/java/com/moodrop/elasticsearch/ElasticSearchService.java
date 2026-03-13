package com.moodrop.elasticsearch;

import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ElasticSearchService {
    static int maxResultNum=  25;
    private final ElasticsearchOperations elasticsearchOperations;



    /**
     * language: "KO" | "ENG"
     * type:     "comment" | "description"
     * queryText: 검색어
     */
    public List<PerfumeEsDocument> search(String language, String type, String queryText) {
        String field = resolveField(language, type);

        Query esQuery = Query.of(q -> q.match(m -> m
                .field(field)
                .query(queryText)));

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(esQuery)
                .withMaxResults(maxResultNum)
                .build();

        SearchHits<PerfumeEsDocument> hits =
                elasticsearchOperations.search(nativeQuery, PerfumeEsDocument.class);

        return hits.stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());
    }

    /**
     * 세부 조건 필터 검색.
     * 모든 파라미터는 선택적(null 허용). null이면 해당 조건 무시.
     * accords, notes는 AND 조건 (모두 포함).
     * language + textType + textQuery 모두 있으면 텍스트 검색도 함께 적용.
     */
    public List<PerfumeEsDocument> filter(PerfumeFilterRequest req) {
        List<Query> filters = new ArrayList<>();
        List<Query> musts   = new ArrayList<>();

        // 이름 - must (relevance scoring)
        if (hasValue(req.getName())) {
            String name = req.getName();
            musts.add(Query.of(q -> q.match(m -> m.field("name").query(name))));
        }

        // 브랜드
        if (hasValue(req.getBrand())) {
            String brand = req.getBrand();
            filters.add(Query.of(q -> q.term(t -> t.field("brand").value(brand))));
        }

        // 평점 범위
        if (req.getRatingMin() != null || req.getRatingMax() != null) {
            Double min = req.getRatingMin();
            Double max = req.getRatingMax();
            filters.add(Query.of(q -> q.range(r -> r.number(n -> {
                n.field("rating.value");
                if (min != null) n.gte(min);
                if (max != null) n.lte(max);
                return n;
            }))));
        }

        // 성별
        if (hasValue(req.getGender())) {
            String gender = req.getGender();
            filters.add(Query.of(q -> q.term(t -> t.field("gender").value(gender))));
        }

        // 국가
        if (hasValue(req.getCountry())) {
            String country = req.getCountry();
            filters.add(Query.of(q -> q.term(t -> t.field("country").value(country))));
        }

        // 연도
        if (req.getYear() != null) {
            int year = req.getYear();
            filters.add(Query.of(q -> q.term(t -> t.field("year").value(year))));
        }

        // 계절 (season.season)
        if (hasValue(req.getSeason())) {
            String season = req.getSeason();
            filters.add(Query.of(q -> q.term(t -> t.field("season.season").value(season))));
        }

        // 낮/밤 (dayNight.day_night)
        if (hasValue(req.getDayNight())) {
            String dayNight = req.getDayNight();
            filters.add(Query.of(q -> q.term(t -> t.field("dayNight.day_night").value(dayNight))));
        }

        // 세기 (sillage.strength)
        if (hasValue(req.getSillage())) {
            String sillage = req.getSillage();
            filters.add(Query.of(q -> q.term(t -> t.field("sillage.strength").value(sillage))));
        }

        // 지속성 (longevity.length)
        if (hasValue(req.getLongevity())) {
            String longevity = req.getLongevity();
            filters.add(Query.of(q -> q.term(t -> t.field("longevity.length").value(longevity))));
        }

        // 주요 향조 - AND 조건 (nested)
        if (req.getAccords() != null) {
            for (String accord : req.getAccords()) {
                filters.add(Query.of(q -> q.nested(n -> n
                        .path("accords")
                        .query(nq -> nq.term(t -> t.field("accords.name").value(accord))))));
            }
        }

        // 특정 노트 - AND 조건 (nested)
        if (req.getNotes() != null) {
            for (String note : req.getNotes()) {
                filters.add(Query.of(q -> q.nested(n -> n
                        .path("notes")
                        .query(nq -> nq.term(t -> t.field("notes.name").value(note))))));
            }
        }

        // 텍스트 검색 조합 (선택)
        if (hasValue(req.getLanguage()) && hasValue(req.getTextType()) && hasValue(req.getTextQuery())) {
            String field = resolveField(req.getLanguage(), req.getTextType());
            String textQuery = req.getTextQuery();
            musts.add(Query.of(q -> q.match(m -> m.field(field).query(textQuery))));
        }

        List<Query> finalMusts   = musts;
        List<Query> finalFilters = filters;
        Query boolQuery = Query.of(q -> q.bool(b -> b
                .must(finalMusts)
                .filter(finalFilters)));

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(boolQuery)
                .withMaxResults(maxResultNum)
                .build();

        SearchHits<PerfumeEsDocument> hits =
                elasticsearchOperations.search(nativeQuery, PerfumeEsDocument.class);

        return hits.stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());
    }

    /**
     * 이름 자동완성: 입력 prefix로 search_as_you_type 필드 검색.
     * 반환: id, name, brand, rating(value)
     */
    public List<AutocompleteDto> autocomplete(String prefix) {
        Query esQuery = Query.of(q -> q.multiMatch(m -> m
                .fields("name", "name._2gram", "name._3gram", "name._index_prefix")
                .query(prefix)
                .type(co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType.BoolPrefix)));

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(esQuery)
                .withMaxResults(maxResultNum)
                .build();

        SearchHits<PerfumeEsDocument> hits =
                elasticsearchOperations.search(nativeQuery, PerfumeEsDocument.class);

        return hits.stream()
                .map(SearchHit::getContent)
                .map(doc -> new AutocompleteDto(
                        doc.getId(),
                        doc.getName(),
                        doc.getBrand(),
                        doc.getRating() != null ? doc.getRating().getValue() : null))
                .collect(Collectors.toList());
    }

    private boolean hasValue(String s) {
        return s != null && !s.isBlank();
    }

    /** Elastic Search에 저장된 인덱스 값에 맞게,
     *  필드명 바꾸기.
     * */
    private String resolveField(String language, String type) {
        boolean isKo  = "KO".equalsIgnoreCase(language);
        boolean isCmt = "comment".equalsIgnoreCase(type);
        boolean isDesc = "description".equalsIgnoreCase(type);

        if (isKo  && isCmt)  return "comments_ko";
        if (isKo  && isDesc) return "description_ko";
        if (!isKo && isCmt)  return "comments_eng";
        if (!isKo && isDesc) return "description";

        throw new IllegalArgumentException("지원하지 않는 language/type: " + language + ", " + type);
    }
}
