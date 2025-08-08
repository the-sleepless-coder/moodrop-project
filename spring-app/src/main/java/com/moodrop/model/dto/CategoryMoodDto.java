package com.moodrop.model.dto;

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
public class CategoryMoodDto {
	int categoryId;
	String categoryDescription;
	int moodId;
	String moodDescription;
}
