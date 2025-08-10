package com.moodrop.web.controller;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moodrop.model.dto.CategoryMoodDto;
import com.moodrop.model.dto.MoodAccordDto;
import com.moodrop.model.dto.PerfumeWrapper;
import com.moodrop.model.service.PerfumeService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api")
public class PerfumeController {
	@Autowired
	PerfumeService service;
	// Test
	@GetMapping("/test")
	public ResponseEntity<String> test(){
		return ResponseEntity.ok("<h1>Hello there!</h1><br><h4><b><span style='color:red;'>WELCOME TO THE PAGE</b></h4>");
	}
	
	// Perfume 전체 정보 가져오기
	@GetMapping("/perfume/{perfumeId}")
	public ResponseEntity<?> getPerfumeById(@PathVariable int perfumeId, HttpServletRequest request, HttpServletResponse response){
		try {
	        PerfumeWrapper perfume = service.getPerfumeWrapper(perfumeId);
	        return ResponseEntity.ok(perfume);
	    } catch (SQLException e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("DB Error occurred");
	    } catch (NoSuchElementException e) {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Perfume not found");
	    }
		
	}
	
	/*
	 * 사용자가 선택한 Accord 기준으로 Perfume 선택 및 user가 보유한 노트 기준으로 분류
	 * Accord가 최대 12개까지 늘어날 수 있기 때문에, Body에 Accord 담에서 보냄. 
	 * */
	@PostMapping("/perfume/accord/{userId}")
	public ResponseEntity<?> filterByAccordAndUserNotes(HttpServletRequest request, HttpServletResponse response, @PathVariable String userId, @RequestBody Map<String,List<String>> body) throws SQLException{
		 List<String> accordList = body.get("accords");
		try {
			Map<String, Object> result = service.filterByAccordWithUserNotes(userId, accordList);
			return ResponseEntity.ok(result);
	    	
	    }catch(Exception e) {
	    	e.printStackTrace();
	    	return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	    }	
	}
	
	// 대분류 가져오기
	@GetMapping("/category")
	public ResponseEntity<?> getCategory(HttpServletRequest request, HttpServletResponse response) throws SQLException{
		List<Map<Integer,String>> category = service.getCategory();
		try {
			return ResponseEntity.ok(category);			
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
		
	}
	
	// 대분류 내 소분류 가져오기(Category 내 Mood 가져오기)
	@GetMapping("/categoryMood")
	public ResponseEntity<?> getCategoryMood(HttpServletRequest request, HttpServletResponse response) throws SQLException{
		List<CategoryMoodDto> categoryMood = service.getCategoryMood();
		try {
			return ResponseEntity.ok(categoryMood);			
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	// Mood를 선택 후, accord 가중치 합이 가장 높은 12개를 가져온다.
	@GetMapping("/perfume/accord")
	public ResponseEntity<?> getAccordByMood(@RequestParam("moodId") List<Integer> moodIdList, HttpServletRequest request, HttpServletResponse response) throws SQLException{
		// moodId라는 키를 갖고 있는 값을, 바로 List로 만든다.
		List<MoodAccordDto> moodAccords = service.calculateAccordWithMood(moodIdList);
		
		try{
			return ResponseEntity.ok(moodAccords);
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	
	
}



















// 사용자가 선택한 Accord 기준으로 Perfume 선택
//	@PostMapping("/perfume/accord")
//	public ResponseEntity<?> filterByAccord(HttpServletRequest request, HttpServletResponse response, @RequestBody Map<String, List<String>> body) {
//	    List<String> accordList = body.get("accords");
//	    try {
//	    	List<PerfumeExtendedDto> filteredPerfumes = service.filterByAccord(accordList);
//	    	return ResponseEntity.ok().body(filteredPerfumes);
//	    	
//	    }catch(Exception e) {
//	    	e.printStackTrace();
//	    	return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//	    }
//	}