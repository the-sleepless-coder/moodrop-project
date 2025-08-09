package com.moodrop.model.dto;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class PerfumeWithMatch extends PerfumeExtendedDto {
	private Map<String, List<String>> userNoteMatch = new LinkedHashMap<>();
    private int noteMatchCount; // 사용자 노트 기준 총 일치 개수
    private Map<String, List<String>> matchNotes = new LinkedHashMap<>(); // 일치하는 노트
}
