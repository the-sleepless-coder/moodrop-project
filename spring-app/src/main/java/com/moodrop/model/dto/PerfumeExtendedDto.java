package com.moodrop.model.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
public class PerfumeExtendedDto extends PerfumeBasicDto{
	private int accordMatchCount;
	private Map<String, Integer> sillage;
	private Map<String, Integer> longevity;
	private Map<String, List<String>> notes;
	private Map<String, Integer> dayNight;
	private Map<String, Integer> season;
}
