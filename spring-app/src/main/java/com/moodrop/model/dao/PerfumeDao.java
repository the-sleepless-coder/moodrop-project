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
import com.moodrop.model.dto.PerfumeWrapperExtended;
import com.moodrop.model.dto.SeasonDto;
import com.moodrop.model.dto.SillageDto;
import com.moodrop.model.dto.UserNoteDto;

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
	
	// Mood -> Accord 값 가져오기
	List<MoodAccordDto> selectMoodAccords(@Param("moodIdList") List<Integer> moodIdList);
	
	// Perfume의 id를 이용해, 상관관계가 높은 note만 추출한다. 
	List<NotesDto> selectDeterminedNotes(Integer perfumeId);
	
	
	// 사용자 보유 노트 등록 
	int insertUserNote(UserNoteDto userNote); 
	
	// 사용자 보유 노트 가져오기
	List<NotesDto> selectUserNotes(String userId);
	
	// 사용자 보유 노트 삭제
	int deleteUserNote(@Param("userId") String userId, @Param("note") String noteName);
	
	// 사용자 보유 노트 수정
	int updateUserNotes(UserNoteDto userNote, String userId);	
	
	// Note로 만들 수 있는 PerfumeId 찾기( 만들 수 있는 향수 개수도 반환, 최대 500개 반환 후 Service에서 개수 통제)
	// listSize만큼을 perfume에서 모두 가져야, perfume 반환.
	List<Integer> selectPerfumeByNotes(@Param("noteList") List<String> noteList, @Param("listSize") int listSize );
	
	// Note로 만들 수 있는 perfumeId 찾기
	// noteList 중 perfume이 노트를 모두 다 담고 있을 경우 (혹은 향후 조정을 위해 minCount이상), perfume 반환.
	List<PerfumeWrapperExtended> selectPerfumeByNotesAtLeastMin(@Param("noteList") List<String> noteList, @Param("minCount") int minCount);
	
	
	
	
	
	
	// notes 이름으로 id/타입 조회
    List<NoteRow> findNotesByNames(@Param("names") List<String> names);

    // accords 이름으로 id 조회
    List<AccordRow> findAccordIdsByNames(@Param("names") List<String> names);

    // accord_note 중계테이블에서 (noteId, accordId, weight) 조회
    List<AccordNoteRow> findAccordNotesByNoteIds(@Param("noteIds") List<Long> noteIds);

    // ---- Row DTOs (내부 클래스) ----
    class NoteRow { public Long id; public String name; public String type; }
    class AccordRow { public Long id; public String name; }
    class AccordNoteRow { public Long noteId; public Long accordId; public double weight; }
	
}
