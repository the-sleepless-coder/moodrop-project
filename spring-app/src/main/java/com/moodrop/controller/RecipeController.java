package com.moodrop.controller;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.moodrop.DTO.RecipeLikeRankingDto;
import com.moodrop.DTO.RecipeRankingDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moodrop.model.dto.UserRecipeDto;
import com.moodrop.service.RecipeService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api")
public class RecipeController {
	@Autowired
	RecipeService service;

	static final int topN=10;

	/**
	 * 사용자의 모든 레시피 조회
	 **/
	@GetMapping("/recipe/user/{userId}")
	public ResponseEntity<?> getPerfumeById(@PathVariable String userId, HttpServletRequest request, HttpServletResponse response){
		
		List<UserRecipeDto> result = service.getUserRecipe(userId);
		return ResponseEntity.ok(result);
	}
	
	/**
	 * 사용자의 레시피 작성
	 * */
	@PostMapping("/recipe")
	public ResponseEntity<?> postPerfume(@RequestBody UserRecipeDto userRecipeDto, HttpServletRequest request, HttpServletResponse response){
		// String token = jwtUtil.resolveToken(req);           // 헤더/쿠키에서
	    // Integer userId = jwtUtil.getUserIdFromToken(token); // 클레임 파싱
		
		// int userPerfumeId = service.createUserRecipe(userRecipeDto, userId);
		int userPerfumeId = service.createUserRecipe(userRecipeDto);
		
		if(userPerfumeId != 0) {
			return ResponseEntity.ok("Successfully Inserted");			
		}else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
		
	}
	
	/**
	 * recipeId로 레시피 조회
	 * @throws SQLException 
	 * 
	 **/
	@GetMapping("/recipe/{recipeId}")
	public ResponseEntity<?> getPerfume(@PathVariable("recipeId") Integer recipeId, HttpServletRequest request, HttpServletResponse response) throws SQLException{
		
		try {			
			UserRecipeDto result = service.selectUserRecipe(recipeId);
			return ResponseEntity.ok(result);
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	/**
	 * 사용자의 레시피 수정
	 **/
	@PatchMapping("/recipe")
	public ResponseEntity<?> patchPerfume(@RequestBody UserRecipeDto userRecipeDto, HttpServletRequest request, HttpServletResponse response){
		
		int result = service.updateUserRecipe(userRecipeDto);
		
		if(result == 1) {
			return ResponseEntity.ok("Successfully Updated data");
		}
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	}
	
	/**
	 * 사용자의 레시피 삭제
	 **/
	@DeleteMapping("/recipe/{recipeId}")
	public ResponseEntity<?> deletePerfume(@PathVariable("recipeId") Integer recipeId, HttpServletRequest request, HttpServletResponse response) throws SQLException{
		int result = service.deleteUserRecipe(recipeId);
		if(result==1) {
			return ResponseEntity.ok("Successfully Deleted");
		}else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
		
	}
	
	/**
	 * 특정 레시피를 나의 레시피로 복사한다.
	 * 해당 레시피의 composition을 가져와서 나의 레시피에 추가한다.
	 * @throws SQLException 
	 * **/
	@PostMapping("/recipe/copy")
	public ResponseEntity<?> copyUserRecipe(@RequestBody Map<String, Object> body, HttpServletRequest request, HttpServletResponse response ) throws SQLException{
		Integer recipeId = (Integer)(body.get("recipeId"));
		String userId = (String) body.get("userId");
		
		int result = service.copyRecipeIntoUser(recipeId, userId);
		
		if (result == 1) {
			return ResponseEntity.ok("Recipe Successfully Copied");
		}else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
		
	}
	
	
	/**
	 * 특정 레시피에 대한 별점을 준다.
	 * @throws SQLException 
	 * */
	@PostMapping("/recipe/{recipeId}/rating")
	public ResponseEntity<?> rateRecipe(@PathVariable Integer recipeId, @RequestBody Map<String, Object> body, HttpServletRequest request, HttpServletResponse response) throws SQLException{
		
		int rating = (Integer)body.get("rating");
		String userId = (String) body.get("userId");
		
		int result = service.insertRecipeRating(userId, recipeId, rating);
		
		if(result ==1) {
			return ResponseEntity.ok("Successfully Rated Recipe");
		}else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();			
		}
		
	}
	
	/**
	 * 특정 레시피에 대한 별점을 준다. (델타 방식 - 최적화 버전)
	 * 전체 평균 재계산 없이 델타 계산만으로 평균 업데이트
	 * @throws SQLException
	 **/
	@PostMapping("/recipe/{recipeId}/rating/delta")
	public ResponseEntity<?> rateRecipeDelta(@PathVariable Integer recipeId, @RequestBody Map<String, Object> body, HttpServletRequest request, HttpServletResponse response) throws SQLException{

		int rating = (Integer)body.get("rating");
		String userId = (String) body.get("userId");

		int result = service.insertRecipeRatingDelta(userId, recipeId, rating);

		if(result == 1) {
			return ResponseEntity.ok("Successfully Rated Recipe (Delta Mode)");
		} else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}

	}

	/**
	 * 특정 레시피의 별점 평균을 가져온다.
	 **/
	@GetMapping("/recipe/{recipeId}/rating")
	public ResponseEntity<?> getRecipeRating(@PathVariable Integer recipeId, HttpServletRequest request, HttpServletResponse response) throws SQLException{

		double result = service.getRecipeRating(recipeId);

		return ResponseEntity.ok(result);
	}

	//-------------------------------
	/**
	 * 사용자가 만든 레시피를 조회한다.
	 * 쿨다운 정책 존재.
	 * */
	@PostMapping("/recipe/{recipeId}/view")
	public ResponseEntity<?> viewRecipe(@PathVariable Integer recipeId, Authentication authentication){

		String userId = authentication.getName();

		boolean result = service.viewRecipe(userId, recipeId);

		if(result){
			return ResponseEntity.ok("Viewed Recipe");
		}else{
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Too many views in a short time");
		}
	}

	/**
	 * 일별로 사용자들에게 "조회 수"가 가장 많은 순으로 레시피 랭킹 Top10을 가져온다.
	 * */
	@GetMapping("/recipe/dailyViewedRanking")
	public ResponseEntity<?> getViewedRecipeRanking(){

		List<RecipeRankingDto> redisResult = service.viewedRecipeRanking();

		int min = Math.min(topN, redisResult.size());

		List<RecipeRankingDto> result = new ArrayList<>();
		for(int idx=0; idx<min; idx++){
			RecipeRankingDto dto = redisResult.get(idx);
			result.add(dto);
		}

		return ResponseEntity.ok(result);
	}

	/**
	 * 사용자가 만든 레시피에 좋아요를 누른다.
	 * */
	@PostMapping("/recipe/{recipeId}/like")
	public ResponseEntity<?> likeRecipe(@PathVariable Integer recipeId, Authentication authentication){
		String userId = authentication.getName();

		boolean liked = service.likeRecipe(userId, recipeId);

		if (liked) {
			return ResponseEntity.ok("Recipe Liked");
		} else {
			return ResponseEntity.ok("Recipe Like Cancelled");
		}
	}

	/**
	 * 일별로 사용자들에게 "좋아요 수" 가장 많은 순으로 레시피 랭킹 Top10을 가져온다.
	 * */
	@GetMapping("/recipe/dailyLikedRanking")
	public ResponseEntity<?> getLikedRecipeRanking(){

		List<RecipeLikeRankingDto> result = service.likedRecipeRanking();

		return ResponseEntity.ok(result.subList(0, Math.min(10, result.size())));
	}



}
