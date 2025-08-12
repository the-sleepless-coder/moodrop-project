package com.moodrop.model.dto;

import java.util.List;

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
public class UserRecipeDto {
	int recipeId;
	@JsonIgnore
	int userPerfumeId;
	int userId;
	String userIdString;
	@JsonIgnore
	String userName;
	String perfumeName;
	String description;
	// String 형식으로 된 composition을 JSON형태로 바꾼다. 
	private List<NotesDto> composition;
	
	
	
	//String composition;
}
