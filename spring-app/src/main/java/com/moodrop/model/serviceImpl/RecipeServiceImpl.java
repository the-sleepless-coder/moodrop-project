package com.moodrop.model.serviceImpl;

import java.sql.SQLException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moodrop.MoodropApplication;
import com.moodrop.model.dao.RecipeDao;
import com.moodrop.model.dto.NotesDto;
import com.moodrop.model.dto.UserRecipeDto;
import com.moodrop.model.service.RecipeService;

@Service
public class RecipeServiceImpl implements RecipeService{

    private final MoodropApplication moodropApplication;

	
	@Autowired
	RecipeDao dao;

    RecipeServiceImpl(MoodropApplication moodropApplication) {
        this.moodropApplication = moodropApplication;
    }

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
	public UserRecipeDto selectUserRecipe(int recipeId) {
		/**
		 * recipeId 조회 안되는 문제 해결 필요.
		 * */
		UserRecipeDto result = dao.selectRecipeById(recipeId);
		return result;
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
	

	
	
	
}
