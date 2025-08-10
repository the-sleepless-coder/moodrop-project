package com.moodrop.model.service;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import com.moodrop.model.dto.CategoryMoodDto;
import com.moodrop.model.dto.MoodAccordDto;
import com.moodrop.model.dto.PerfumeWrapper;

public interface PerfumeService {
	PerfumeWrapper getPerfumeWrapper(int id) throws SQLException;
	
	List<Map<Integer, String>> getCategory() throws SQLException;
	
	List<CategoryMoodDto>getCategoryMood() throws SQLException;

	Map<String, Object> filterByAccordWithUserNotes(String userId, List<String> accords) throws SQLException;
	
	List<MoodAccordDto>calculateAccordWithMood(List<Integer> moods);
	
	
	//List<PerfumeExtendedDto> filterByAccord(List<String> accords) throws SQLException;
	
}
