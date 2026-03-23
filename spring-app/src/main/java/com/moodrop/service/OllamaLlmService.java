package com.moodrop.service;

import com.moodrop.DTO.FragranceQueryResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class OllamaLlmService {

    private static final String LLM_MODEL = "llama3.2";

    private final RestTemplate restTemplate;
    private final String ollamaUrl;

    public OllamaLlmService(RestTemplateBuilder builder,
                            @Value("${ollama.url}") String ollamaUrl) {
        this.restTemplate = builder.build();
        this.ollamaUrl = ollamaUrl;
    }

    /**
     * 사용자 쿼리를 향수 묘사 언어로 변환하고 타겟 gender도 추출
     */
    @SuppressWarnings("unchecked")
    public FragranceQueryResult convertToFragranceQuery(String userQuery) {
        String prompt = """
                You are a perfume expert. Rewrite the user query as a short natural perfume description (max 15 words).
                Use fragrance words like: floral, woody, musky, fresh, oriental, feminine, masculine, sensual, warm, etc.
                Do NOT use structured format.
                Then on the next line, write the intended wearer's gender as one of: male, female, unisex.

                Examples:
                Query: I want a scent that makes me seductive to men
                Description: sensual feminine fragrance with musky floral and warm oriental notes
                gender: female

                Query: I want something fresh and clean for summer
                Description: fresh aquatic citrus fragrance light and clean
                gender: unisex

                Query: I want a scent for my girlfriend, a sexy one
                Description: sensual feminine fragrance with musky floral notes
                gender: female

                Query: %s
                Description:""".formatted(userQuery);

        Map<String, Object> body = Map.of(
                "model", LLM_MODEL,
                "prompt", prompt,
                "stream", false
        );

        try {
            Map<String, Object> response = restTemplate.postForObject(
                    ollamaUrl + "/api/generate",
                    body,
                    Map.class
            );
            String raw = ((String) response.get("response")).strip();

            String description = userQuery;
            String gender = "unisex";

            for (String line : raw.split("\n")) {
                line = line.strip();
                if (line.toLowerCase().startsWith("gender:")) {
                    gender = line.substring(7).strip().toLowerCase();
                } else if (!line.isEmpty() && description.equals(userQuery)) {
                    description = line.replaceFirst("(?i)^description:\\s*", "");
                }
            }

            log.info("[OllamaLlm] '{}' → description='{}', gender='{}'", userQuery, description, gender);
            return new FragranceQueryResult(description, gender);

        } catch (Exception e) {
            log.warn("[OllamaLlm] LLM 변환 실패, 원문 사용: {}", e.getMessage());
            return new FragranceQueryResult(userQuery, "unisex");
        }
    }
}
