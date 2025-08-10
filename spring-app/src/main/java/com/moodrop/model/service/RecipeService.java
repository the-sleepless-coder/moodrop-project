package com.moodrop.model.service;

import java.util.List;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.moodrop.model.dto.UserRecipeDto;

public interface RecipeService {
	List<UserRecipeDto> getUserRecipe(String userId);
}
