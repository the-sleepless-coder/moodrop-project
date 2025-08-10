package com.moodrop.model.serviceImpl;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moodrop.MoodropApplication;
import com.moodrop.model.dao.RecipeDao;
import com.moodrop.model.dto.UserRecipeDto;
import com.moodrop.model.service.RecipeService;

@Service
public class RecipeServiceImpl implements RecipeService{

	
	@Autowired
	RecipeDao dao;

	
    /*
     * userId를 이용해서 Recipe를 가져온다.
     * */
	@Override
	public List<UserRecipeDto> getUserRecipe(String userId) {
		
		List<UserRecipeDto> userRecipeList = dao.selectUserRecipe(userId);
		
		return userRecipeList;
	}
	
}


//		ObjectMapper mapper = new ObjectMapper();
//		
//		// 기본적으로 JSON은 문자열이기 때문에, Iterable하게 만들기 위해 mapper를 써야 한다.
//		for(UserRecipeDto ur: userRecipeList) {
//			String compositionJson = ur.getComposition(); 
//			List<Map<String, Object>> compositionList =
//			        mapper.readValue(compositionJson, new TypeReference<List<Map<String, Object>>>() {});
//			
//			for (Map<String, Object> item : compositionList) {
//			    System.out.println(item.get("note"));   
//			    System.out.println(item.get("type"));
//			    System.out.println(item.get("weight"));
//			}
//			String composition = ur.getComposition();	
//			System.out.println(composition);
//			
//		}