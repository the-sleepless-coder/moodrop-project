package com.moodrop.model.dao;

import java.util.List;

import org.springframework.data.repository.query.Param;

import com.moodrop.model.dto.NotesDto;
import com.moodrop.model.dto.UserRecipeDto;

public interface RecipeDao {
		// 사용자 보유 레시피 가져오기
		List<UserRecipeDto> selectUserRecipe(String userId);
		
		// Composition 일괄적으로 INSERT (notes.name -> id 서브쿼리 매핑)
	    int insertCompositionsInRecipe(
	        @Param("userPerfumeId") Integer userPerfumeId,
	        @Param("items") List<NotesDto> items
	    );
	    
	    // Note의 id 반환
	    List<Integer> selectNoteIdByName(@Param("names") List<NotesDto> names);
	    
	    // 사용자 레시피 작성하기
	    int insertUserRecipe(UserRecipeDto userRecipe /*, @Param("userId") Integer userId*/);

	    // recipeId로 레시피 조회하기
	    UserRecipeDto selectRecipeById(@Param("recipeId") int id );
	    
	    // 레시피 수정하기
	    int updateUserRecipe(UserRecipeDto userRecipe);
	    
	    int upsertCompositionsInRecipe(@Param("recipeId") Integer recipeId, @Param("items") List<NotesDto> items);
	    
	    
	    // recipeId로 레시피 삭제하기
	    int deleteRecipeById(int id /*, @Param("userId") Integer userId*/);
	    
	    int deleteCompositionById(int recipeId);
	    
	    // recipeId 로 userId로 레시피 복사하기
	    // int insertRecipeToUser(int userId, int recipeId);
	    
	    // recipe 별점 주기
	    int insertRecipeRating(int userId, int recipeId, int rating);
	    
	    
	    // recipe 별점 가져오기
	    float selectRecipeRating(int recipeId);
	    
}
