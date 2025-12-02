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
	    
	    
	    // recipe 별점을 주는 시점에 평균을 계산하고 저장
	    // 그 후에는 저장한 평균 값을 조회해서 읽어오는 방식으로 조회하는 것이 효율적이다.
	    
	    // recipe 별점 주기
	    int insertRecipeRating(int userId, int recipeId, int rating);
	    
	    // recipe 별점 가져오기.
	    double selectAverageRating(int recipeId);
	    
	    // recipe 별점 업데이트 하기.
	    int updateRecipeAverage(int recipeId, double avg);

	    // 업데이트한 recipe 별점 가져오기.
	    double selectRecipeAverageFromDb(int recipeId);

	    // recipe 별점 주기 (델타 방식 - 최적화 버전)
	    // INSERT + UPDATE를 한 번에 처리하여 성능 향상
	    int insertRecipeRatingDelta(int userId, int recipeId, int rating);

}
