package com.moodrop.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class OllamaEmbedService {

    @Value("${ollama.url}")
    private String ollamaUrl;

    private final RestTemplate restTemplate;

    public OllamaEmbedService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    /**
     * 텍스트 리스트를 한 번에 Ollama에 요청 → 벡터 리스트 반환
     * 향수 1개당 호출 1번
     */
    @SuppressWarnings("unchecked")
    public List<List<Double>> embedBatch(List<String> texts) {
        Map<String, Object> request = Map.of(
                "model", "nomic-embed-text",
                "input", texts
        );

        Map<String, Object> response = restTemplate.postForObject(
                ollamaUrl + "/api/embed",
                request,
                Map.class
        );

        return (List<List<Double>>) response.get("embeddings");
    }
}
