package com.moodrop.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class QdrantVectorService {

    @Value("${qdrant.url}")
    private String qdrantUrl;

    private final RestTemplate restTemplate;

    public QdrantVectorService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public void ensureCollection(String collection, int dim) {
        try {
            restTemplate.getForObject(qdrantUrl + "/collections/" + collection, Map.class);
            log.info("[Qdrant] Collection '{}' already exists.", collection);
        } catch (HttpClientErrorException.NotFound e) {
            Map<String, Object> body = Map.of(
                    "vectors", Map.of("size", dim, "distance", "Cosine")
            );
            restTemplate.put(qdrantUrl + "/collections/" + collection, body);
            log.info("[Qdrant] Collection '{}' created.", collection);
        }
    }

    /**
     * points: [{ "id": 467500, "vector": [...], "payload": {...} }, ...]
     */
    public void upsert(String collection, List<Map<String, Object>> points) {
        Map<String, Object> body = Map.of("points", points);
        restTemplate.put(qdrantUrl + "/collections/" + collection + "/points", body);
    }
}
