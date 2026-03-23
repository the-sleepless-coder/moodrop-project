package com.moodrop.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@AllArgsConstructor
public class VectorSearchResultDto {
    private String gender;
    private List<Map<String, Object>> candidates;
}
