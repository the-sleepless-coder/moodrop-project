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
public class NotesDto {
	// Note Info
	@JsonIgnore
	private int noteId;
	private String name;
	private String type;
	private Integer weight;
	private String koreanName;
}
