package com.moodrop.model.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonUnwrapped;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PerfumeWrapper {
	
	// 기본 Perfume 정보
	@JsonUnwrapped
	private PerfumeBasicDto perfumeBasic;
	
	// 다른 테이블 조회 정보
	private Map<String, Integer> dayNightInfo;
    private Map<String, Integer> longevityInfo;
    private List<MainAccordDto> mainAccord;
    private Map<String, List<String>> notes;
    private Map<String, Integer> seasonInfo;
    private Map<String, Integer> sillageInfo;

	
}
