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
import org.springframework.web.bind.annotation.RestController;

import com.moodrop.model.dto.CategoryMoodDto;
import com.moodrop.model.dto.PerfumeExtendedDto;
import com.moodrop.model.dto.PerfumeWrapper;
import com.moodrop.model.service.PerfumeService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api")
public class PerfumeController {
	@Autowired
	PerfumeService service;
	
	@GetMapping("/hithere")
	public ResponseEntity<String> hello(){
		return ResponseEntity.ok("Hi there");
	}
	
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
	
	@PostMapping("/perfume/accord")
	public ResponseEntity<?> filterByAccord(HttpServletRequest request, HttpServletResponse response, @RequestBody Map<String, List<String>> body) {
	    List<String> accordList = body.get("accords");
	    try {
	    	List<PerfumeExtendedDto> filteredPerfumes = service.filterByAccord(accordList);
	    	return ResponseEntity.ok().body(filteredPerfumes);
	    	
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
	
	
}
