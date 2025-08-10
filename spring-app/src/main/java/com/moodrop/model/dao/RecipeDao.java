package com.moodrop.model.dao;

import java.util.List;

import com.moodrop.model.dto.UserRecipeDto;

public interface RecipeDao {
		// 사용자 보유 레시피 가져오기
		List<UserRecipeDto> selectUserRecipe(String userId);
}
