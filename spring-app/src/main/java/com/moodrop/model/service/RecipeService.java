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
	
	// 특정 recipeId를 나의 레시피로 복사한다.
	int copyRecipeIntoUser(int recipeId, String userId) throws SQLException;
	
	// 특정 recipe에 rating을 부여한다.
	int insertRecipeRating(String userIdString, int recipeId, int rating) throws SQLException;
	
	
}
