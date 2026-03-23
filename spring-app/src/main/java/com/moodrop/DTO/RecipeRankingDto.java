package com.moodrop.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RecipeRankingDto {
    private Integer recipeId;
    private String recipeName;
    private Integer dailyViews;
}
