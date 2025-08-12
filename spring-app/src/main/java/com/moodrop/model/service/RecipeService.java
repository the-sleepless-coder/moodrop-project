package com.moodrop.model.service;

import java.sql.SQLException;
import java.util.List;

import com.moodrop.model.dto.UserRecipeDto;

public interface RecipeService {
	// 사용자의 레시피를 가져온다.
	List<UserRecipeDto> getUserRecipe(String userId);
	
	// 사용자의 레시피를 작성한다.
	int createUserRecipe(UserRecipeDto userRecipe);
	
	// 사용자의 레시피를 id로 조회한다.
	UserRecipeDto selectUserRecipe(int recipeId);
	
	// 사용자의 레시피를 수정한다.
	int updateUserRecipe(UserRecipeDto userRecipe);
	
	// 사용자의 레시피를 id로 삭제한다.
	int deleteUserRecipe(int recipeId) throws SQLException;
	
	
}
