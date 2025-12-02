package com.moodrop.model.serviceImpl;

import java.sql.SQLException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moodrop.model.dao.RecipeDao;
import com.moodrop.model.dao.UserDao;
import com.moodrop.model.dto.UserRecipeDto;
import com.moodrop.model.service.RecipeService;

@Service
public class RecipeServiceImpl implements RecipeService{
	
	@Autowired
	RecipeDao dao;
	
	@Autowired
	UserDao userDao;
	
//	private final MoodropApplication moodropApplication;
//    RecipeServiceImpl(MoodropApplication moodropApplication) {
//        this.moodropApplication = moodropApplication;
//    }

    /*
     * userId를 이용해서 사용자의 모든 Recipe를 가져온다.
     * */
	@Override
	public List<UserRecipeDto> getUserRecipe(String userId) {
		
		List<UserRecipeDto> userRecipeList = dao.selectUserRecipe(userId);
		
		return userRecipeList;
	}
	
	/*
	 * 사용자의 레시피를 작성한다.
	 * userRecipe 및 composition이 insert돼야 commit되게 한다.
	 * 그렇지 않으면 Rollback. 
	 * 추가 구현 사항: userId 포함, perfumeName 동일 시 rollBack 및 오류 메시지, rating_table 만들어서 평균 값 가져오기 
	 * */
	@Override
	@Transactional
	public int createUserRecipe(UserRecipeDto userRecipe) {
		// 사용자 userId 받을 시(UserRecipeDto userRecipe, userId)
		// userRecipe.setUserId(userId)
		int resultStatus = dao.insertUserRecipe(userRecipe);
		int userPerfumeId = userRecipe.getRecipeId();
		if( userPerfumeId == 0) {
			throw new IllegalStateException("userPerfume을 가져오는 데 실패했습니다.");
		}
		
		if(userRecipe.getComposition() != null) {			
			dao.insertCompositionsInRecipe(userPerfumeId, userRecipe.getComposition());
		}
		
		return userPerfumeId;
	}
	
	// recipeId로 레시피를 조회한다.
	@Override
	public UserRecipeDto selectUserRecipe(int recipeId) throws SQLException {
		/**
		 * recipeId 조회 안되는 문제 해결 필요.
		 * */
		UserRecipeDto recipe = dao.selectRecipeById(recipeId);
		if( recipe == null ) throw new SQLException("Recipe Not Found");
		System.out.println(recipe);
		
		return recipe;
	}
	
	// recipe를 수정한다.
	@Override
	public int updateUserRecipe(UserRecipeDto userRecipe) {
		int updateRecipeResult = dao.updateUserRecipe(userRecipe);
		int recipeId = userRecipe.getRecipeId();
		
		int updateCompositionResult = dao.upsertCompositionsInRecipe(recipeId, userRecipe.getComposition());
		if(updateRecipeResult >0 && updateCompositionResult>0) {
			return 1;
		}
		
		return 0;
		
	}
	
	// recipeId로 레시피를 삭제한다.
	// 추가 구현 사항: userId 포함 
	@Override
	public int deleteUserRecipe(int recipeId) throws SQLException {
		
		int recipeDeleteResult = dao.deleteRecipeById(recipeId);
		
		if(recipeDeleteResult == 1 ) {
			return 1;
		}else {
			throw new SQLException();
		}
		
	}
	
	// 특정 사용자의 recipe를 나의 레시피로 복사한다.
	@Override
	@Transactional
	public int copyRecipeIntoUser(int recipeId, String userIdString) throws SQLException {
		
		int userId = userDao.selectUserByString(userIdString);
		if(userId != 0) {
			// RecipeId로 recipe 넣기
			// userId를 로그인한 사람의 것으로 설정한다.
			UserRecipeDto recipe = dao.selectRecipeById(recipeId);
			recipe.setUserId(userId);
			// System.out.println(userId);
			
			int userRecipeResult = dao.insertUserRecipe(recipe);
			if (userRecipeResult == 0) throw new SQLException("Insert user_perfumes failed");
			// System.out.println(userRecipeResult);
			
			// Generated PK 사용.
			int newRecipeId = recipe.getRecipeId();
			
			// composition이 존재한다면, recipeId에 맞게 composition을 넣어준다.
			if(recipe.getComposition() != null) {			
				int compositionResult = dao.insertCompositionsInRecipe( newRecipeId, recipe.getComposition());
				if(compositionResult == 0 ) throw new SQLException("Insert compositions failed");
			}
			
			return 1;
		}else {
			return 0;
		}
		
	}
	
	/**
	 * 레시피에 대한 평점을 준다.
	 * **/
	@Override
	public int insertRecipeRating(String userIdString, int recipeId, int rating) throws SQLException{
		
		// 평점에 대한 범위 설정
		if (rating < 1 || rating > 5) {
	        throw new IllegalArgumentException("rating은 1~5 사이여야 합니다.");
	    }
		
		// userId, recipeId, rating을 이용해서 평점 정보를 남긴다.
		int userId = userDao.selectUserByString(userIdString);
		
		int result = dao.insertRecipeRating(userId, recipeId, rating);
		if(result !=0) {
			// 별점 평균 연산 후 갱신
			double avg = dao.selectAverageRating(recipeId);
			dao.updateRecipeAverage(recipeId, avg);
			
			return result;
		}else {
			throw new SQLException();
		}	
	}
	
	
	/**
	 * 레시피에 대한 평점을 준다. (델타 방식 - 최적화 버전)
	 * 전체 평균 재계산 없이 델타 계산만으로 평균 업데이트
	 * INSERT + UPDATE 2개 쿼리만 실행 (SELECT 불필요)
	 * @Transactional로 원자성 보장
	 **/
	@Override
	@Transactional
	public int insertRecipeRatingDelta(String userIdString, int recipeId, int rating) throws SQLException {

		// 평점 범위 검증
		if (rating < 1 || rating > 5) {
			throw new IllegalArgumentException("rating은 1~5 사이여야 합니다.");
		}

		// userId 조회
		int userId = userDao.selectUserByString(userIdString);

		// 델타 방식으로 INSERT + UPDATE 동시 실행
		int result = dao.insertRecipeRatingDelta(userId, recipeId, rating);

		if(result != 0) {
			return result;
		} else {
			throw new SQLException("별점 입력에 실패했습니다.");
		}
	}

	/**
	 * 레시피에 대해 이미 계산된 평점 평균을 가져온다.
	 * @throws SQLException
	 ***/
	@Override
	public double getRecipeRating(int recipeId) throws SQLException {
		double result = dao.selectRecipeAverageFromDb(recipeId);

		if(result != 0) {
			return result;
		}else {
			throw new SQLException();
		}

	}




}
