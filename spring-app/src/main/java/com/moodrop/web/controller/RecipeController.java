package com.moodrop.web.controller;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.moodrop.model.dto.UserRecipeDto;
import com.moodrop.model.service.RecipeService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api")
public class RecipeController {
	@Autowired
	RecipeService service;
	
//	@GetMapping("/usertest")
//	public ResponseEntity<String> user(){
//		return ResponseEntity.ok("Hi there");
//	}
	
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
	 * 
	 **/
	@GetMapping("/recipe/{recipeId}")
	public ResponseEntity<?> getPerfume(@PathVariable("recipeId") Integer recipeId, HttpServletRequest request, HttpServletResponse response){
		
		UserRecipeDto result = service.selectUserRecipe(recipeId);
		try {			
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
	
}
