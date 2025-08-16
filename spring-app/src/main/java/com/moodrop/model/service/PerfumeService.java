package com.moodrop.model.service;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import com.moodrop.model.dto.CategoryMoodDto;
import com.moodrop.model.dto.MoodAccordDto;
import com.moodrop.model.dto.NotesDto;
import com.moodrop.model.dto.PerfumeWrapper;
import com.moodrop.model.dto.PerfumeWrapperExtended;
import com.moodrop.model.dto.UserNoteDto;

public interface PerfumeService {
	PerfumeWrapper getPerfumeWrapper(int id) throws SQLException;
	
	List<Map<Integer, String>> getCategory() throws SQLException;
	
	List<CategoryMoodDto>getCategoryMood() throws SQLException;

	Map<String, Object> filterByAccordWithUserNotes(String userId, List<String> accords) throws SQLException;
	
	List<MoodAccordDto>calculateAccordWithMood(List<Integer> moods);
	
	List<NotesDto> getDeterminedNotes(int perfumeId);
	
	//List<PerfumeExtendedDto> filterByAccord(List<String> accords) throws SQLException;
	
	List<NotesDto> getUserNotes(String userId);
	
	int insertUserNote(UserNoteDto userNote) throws SQLException;

	int deleteUserNote(String userId, String note) throws SQLException;

	/**
	 * 노트 일부만 담고 있는 향수를 검색한다.(최대 500개 반환 후 Service에서 개수 통제)
	 * @throws SQLException 
	 * **/
	List<PerfumeWrapper> selectPerfumeByNote(List<String> noteList) throws SQLException;
	
	/**
	 * 모든 노트를 담고 있는 향수를 검색한다.(최대 500개 반환 후 Service에서 개수 통제)
	 * @throws SQLException 
	 * **/
	List<PerfumeWrapperExtended> selectPerfumeByAtLeastKNotes(List<String> noteList) throws SQLException;
	
	
	
}
