package com.moodrop.model.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;

import com.moodrop.model.dto.CategoryMoodDto;
import com.moodrop.model.dto.DayNightDto;
import com.moodrop.model.dto.LongevityDto;
import com.moodrop.model.dto.MainAccordDto;
import com.moodrop.model.dto.MoodAccordDto;
import com.moodrop.model.dto.NotesDto;
import com.moodrop.model.dto.PerfumeBasicDto;
import com.moodrop.model.dto.PerfumeMatchDto;
import com.moodrop.model.dto.SeasonDto;
import com.moodrop.model.dto.SillageDto;

public interface PerfumeDao {
	// Accord로 Perfume Basic 정보 조회
	List<PerfumeMatchDto> searchByAccord(List<String> accords);
	
	// Perfume Wrapper의 전체 정보를 갖고 오기 위한 Query 문
	// 테이블 마다 DAO를 이용해 필요한 DB정보를 갖고 온다.
	PerfumeBasicDto selectPerfumeBasicByPerfumeId(int id);
	
	List<LongevityDto> selectLongevityByPerfumeId(int id);
	
	List<MainAccordDto> selectMainAccordByPerfumeId(int id);
	
	List<NotesDto> selectNotesByPerfumeId(int id);
	
	List<SeasonDto> selectSeasonByPerfumeId(int id);
	
	List<SillageDto> selectSillageByPerfumeId(int id);
	
	List<DayNightDto> selectDayNightByPerfumeId(int id);
	
	List<String> selectCommentByPerfumeId(int id);
	
	// 카테고리 정보
	List<Map<Integer, String>> selectCategoryInfo();
	
	List<CategoryMoodDto> selectCategoryMoodInfo();
	
	// 사용자 보유 노트 가져오기
	List<NotesDto> selectUserNotes(String userId);
	
	// Mood -> Accord 값 가져오기
	List<MoodAccordDto> selectMoodAccords(@Param("moodIdList") List<Integer> moodIdList);
	
}
