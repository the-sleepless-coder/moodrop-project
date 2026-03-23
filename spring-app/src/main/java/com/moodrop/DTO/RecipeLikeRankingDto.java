package com.moodrop.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RecipeLikeRankingDto {
    private Integer recipeId;
    private String recipeName;
    private Integer likeCount;
}
