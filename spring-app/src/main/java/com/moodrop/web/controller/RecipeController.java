package com.moodrop.web.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
	
	@GetMapping("/recipe/{userId}")
	public ResponseEntity<?> getPerfumeById(@PathVariable String userId, HttpServletRequest request, HttpServletResponse response){
		
		List<UserRecipeDto> result = service.getUserRecipe(userId);
		return ResponseEntity.ok(result);
	}
	
	
}
