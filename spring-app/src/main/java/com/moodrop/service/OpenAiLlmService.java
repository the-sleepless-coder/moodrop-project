package com.moodrop.service;

import com.moodrop.DTO.FragranceQueryResult;
import com.moodrop.DTO.VectorSearchResultDto;
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class OpenAiLlmService {

    private final OpenAIClient client;

    //서비스 객체 생성될 때, client 객체에 api키를 넣고 주입 받는다.
    public OpenAiLlmService(@Value("${openai.secret-key}") String apiKey) {
        this.client = OpenAIOkHttpClient.builder()
                .apiKey(apiKey)
                .build();
    }

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

        ResponseCreateParams params = ResponseCreateParams.builder()
                .model("gpt-5.4")
                .input(prompt)
                .build();

        Response response = client.responses().create(params);

        // output[0] = message, content[0] = outputText (텍스트 응답은 항상 1개)
        String rawResponse = response.output().get(0)
                .asMessage()
                .content().get(0)
                .asOutputText()
                .text()
                .trim();

        // 첫 줄 = description, 마지막 줄 = gender
        String[] lines = rawResponse.split("\\n");
        String description = lines[0].trim();
        String gender = lines[lines.length - 1].trim().toLowerCase();

        // male / female / unisex 외의 값이면 unknown으로
        if (!gender.equals("male") && !gender.equals("female") && !gender.equals("unisex")) {
            gender = "unknown";
        }

        log.info("[OpenAI] description='{}' gender='{}'", description, gender);
        return new FragranceQueryResult(description, gender);
    }

    // 최종적으로 추천된 5개의 향수를 이용해,
    // 각 향수에 대한 한줄 요약 및 향수에 대한 총평을 한다.
    @SuppressWarnings("unchecked")
    public String generateRecommendation(String userQuery, VectorSearchResultDto top5) {
        StringBuilder perfumeInfo = new StringBuilder();
        List<Map<String, Object>> candidates = top5.getCandidates();
        for (int i = 0; i < candidates.size(); i++) {
            Map<String, Object> payload = (Map<String, Object>) candidates.get(i).get("payload");
            String name    = (String) payload.getOrDefault("name", "Unknown");
            List<String> notes   = (List<String>) payload.getOrDefault("notes", List.of());
            List<String> accords = (List<String>) payload.getOrDefault("accords", List.of());
            String text  = (String) payload.getOrDefault("text", "");
            // description은 text의 첫 문단 (첫 번째 \n\n 이전)
            String desc = text.contains("\n\n") ? text.substring(0, text.indexOf("\n\n")) : text;

            perfumeInfo.append(String.format("""
                    %d. %s
                       Notes: %s
                       Accords: %s
                       Description: %s
                    """, i + 1, name, notes, accords, desc));
        }
        
        boolean isKorean = userQuery.chars().anyMatch(c -> c >= 0xAC00 && c <= 0xD7A3);

        String language = "";
        if(isKorean) language = "korean";
        else{language = "english";}

        String prompt = """
                You are a friendly and knowledgeable perfume expert.
                A user asked: "%s"

                Based on their preferences, here are 5 recommended perfumes:
                %s

                Please write a response in %s that includes:
                1. A brief one-line description for each of the 5 perfumes (mention key notes and accords)
                2. An overall recommendation paragraph summarizing why these perfumes match the user's request

                Format:
                %s
                """.formatted(userQuery, perfumeInfo, language,
                isKorean
                ? "1. [향수명]: [한 줄 설명]\n2. [향수명]: [한 줄 설명]\n...\n\n총평: [전체적인 추천 이유와 조언]"
                : "1. [Perfume Name]: [one-line description]\n2. [Perfume Name]: [one-line description]\n...\n\nOverall: [recommendation summary and advice]");

        ResponseCreateParams params = ResponseCreateParams.builder()
                .model("gpt-5.4")
                .input(prompt)
                .build();

        Response response = client.responses().create(params);
        return response.output().get(0)
                .asMessage()
                .content().get(0)
                .asOutputText()
                .text()
                .trim();
    }

}
