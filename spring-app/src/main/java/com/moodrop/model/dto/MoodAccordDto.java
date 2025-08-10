package com.moodrop.model.dto;

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
public class MoodAccordDto {
	// moodAccord Info
//	String moodIds;
//	String mood;
	int accordId;
	String accord;
	float totalWeight;
	
}
