package com.moodrop.model.serviceImpl;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import com.moodrop.model.dao.PerfumeDao;
import com.moodrop.model.dto.CategoryMoodDto;
import com.moodrop.model.dto.DayNightDto;
import com.moodrop.model.dto.LongevityDto;
import com.moodrop.model.dto.MainAccordDto;
import com.moodrop.model.dto.MoodAccordDto;
import com.moodrop.model.dto.NotesDto;
import com.moodrop.model.dto.PerfumeBasicDto;
import com.moodrop.model.dto.PerfumeExtendedDto;
import com.moodrop.model.dto.PerfumeMatchDto;
import com.moodrop.model.dto.PerfumeWithMatch;
import com.moodrop.model.dto.PerfumeWrapper;
import com.moodrop.model.dto.PerfumeWrapperExtended;
import com.moodrop.model.dto.SeasonDto;
import com.moodrop.model.dto.SillageDto;
import com.moodrop.model.dto.UserNoteDto;
import com.moodrop.model.service.PerfumeService;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class PerfumeServiceImpl implements PerfumeService{
	
	private final PerfumeDao dao;
	//private final NoteRepository noteRepository;
	//private final AccordRepository accordRepository;
	//private final AccordNoteRepository accordNoteRepository;
	
	// selectPerfumeByNotes, selectPerfumeByNotesAtLeastK
	private static final int MIN_COUNT = 3;
	
	// selectPerfumeByNotesAtLeastK
	private static final int RESTRICT_COUNT = 100;
	
	// JSON String -> List<String> Parsing 용도로 쓰임.
	private static final com.fasterxml.jackson.databind.ObjectMapper OM = new com.fasterxml.jackson.databind.ObjectMapper();

	private static java.util.List<String> parseNotes(String json) {
	    if (json == null || json.isBlank()) return java.util.List.of();
	    try {
	        return OM.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {});
	    } catch (Exception e) {
	        // 필요하면 로그
	        // log.warn("Failed to parse matchedNotesJson: {}", json, e);
	        return java.util.List.of();
	    }
	}
	
	 /**
	 Perfume에 대한 전체 정보 조회
	 **/
	@Override
	public PerfumeWrapper getPerfumeWrapper(int id) throws SQLException {
		// perfumeId로 perfume 전체 정보 조회
		// 정보 없으면 SQL Exception을 띄운다.
		// DAO에서 DB의 정보를 갖고 오고, Service에서 조립한다.
		// 조립한 정보를 DTO를 이용해서 서로 다른 MVC Layer에서 정보를 주고 받는 데 쓴다.
		PerfumeBasicDto basic = dao.selectPerfumeBasicByPerfumeId(id);
		if(basic == null) throw new SQLException("Perfume Not Found");		
		List<String> comments = dao.selectCommentByPerfumeId(id);
		basic.setComments(comments);
		
		// dayNightInfo
		List<DayNightDto> dayNightList = dao.selectDayNightByPerfumeId(id);
		Map<String, Integer> dayNightInfo = new HashMap<>();
		for (DayNightDto dto : dayNightList) {
		    dayNightInfo.put(dto.getDayNight(), dto.getWeight());
		}

		// longevityInfo
		List<LongevityDto> longevityList = dao.selectLongevityByPerfumeId(id);
		Map<String, Integer> longevityInfo = new HashMap<>();
		for (LongevityDto dto : longevityList) {
		    longevityInfo.put(dto.getLength(), dto.getVoteNum());
		}

		// seasonInfo
		List<SeasonDto> seasonList = dao.selectSeasonByPerfumeId(id);
		Map<String, Integer> seasonInfo = new HashMap<>();
		for (SeasonDto dto : seasonList) {
		    seasonInfo.put(dto.getSeason(), dto.getWeight());
		}

		// sillageInfo
		List<SillageDto> sillageList = dao.selectSillageByPerfumeId(id);
		Map<String, Integer> sillageInfo = new HashMap<>();
		for (SillageDto dto : sillageList) {
		    sillageInfo.put(dto.getStrength(), dto.getVoteNum());
		}
		
		List<MainAccordDto> mainAccord = dao.selectMainAccordByPerfumeId(id);
		
		List<NotesDto> notesList = dao.selectNotesByPerfumeId(id);
		Map<String, List<String>> notesMap = new LinkedHashMap<>();
        for(NotesDto n: notesList) {
        	String key = n.getType().toLowerCase();
        	
        	if(!notesMap.containsKey(key)) {
        		notesMap.put(key, new ArrayList<>());
        	}
        	
        	notesMap.get(key).add(n.getName());
        	
        }
        
        
		PerfumeWrapper perfumeWrapper = new PerfumeWrapper(basic, dayNightInfo, longevityInfo, mainAccord, notesMap, seasonInfo, sillageInfo);
		
		return perfumeWrapper;
	}

	
	/** 사용자가 보유한 노트 기준으로 필터
	Accord 로 걸러낸 향수를, 사용자가 갖고 있는 note기준으로 나눈다.
	**/
	@Override
	public Map<String, Object> filterByAccordWithUserNotes(
	        String userId,            
	        List<String> accords
	) throws SQLException {

	    // DB에서 사용자 노트 기준 -> Determined Notes의 향수를 찾는다.
	    List<NotesDto> userNotesList = dao.selectUserNotes(userId);

	    // Map<String, List<String>> 형태로 변환
	    Map<String, List<String>> userNotes = new LinkedHashMap<>();
	    for (NotesDto n : userNotesList) {
	        if (n == null || n.getType() == null || n.getName() == null) continue;
	        userNotes.computeIfAbsent(n.getType(), k -> new ArrayList<>()).add(n.getName());
	    }

	    // Set으로 변환(중복 제거만)
	    Set<String> uTop    = new HashSet<>(userNotes.getOrDefault("top",    List.of()));
	    Set<String> uMiddle = new HashSet<>(userNotes.getOrDefault("middle", List.of()));
	    Set<String> uBase   = new HashSet<>(userNotes.getOrDefault("base",   List.of()));

	    // 1) Accord로 후보 조회
	    List<PerfumeMatchDto> filtered = dao.searchByAccord(accords);
	    
	    List<PerfumeWithMatch> matched = new ArrayList<>();
	    List<PerfumeExtendedDto> noMatched = new ArrayList<>();

	    for (PerfumeMatchDto p : filtered) {
	        int pfId = p.getPerfumeId();

	        // 기본 정보 + 부가 정보
	        PerfumeBasicDto basic = dao.selectPerfumeBasicByPerfumeId(pfId);
	        PerfumeExtendedDto dto = new PerfumeExtendedDto();
	        BeanUtils.copyProperties(basic, dto);
	        dto.setAccordMatchCount(p.getAccordMatchCount());
	        
	        Map<String, Integer> sillageMap = new HashMap<>();
	        for (SillageDto s : dao.selectSillageByPerfumeId(pfId)) {
	            sillageMap.put(s.getStrength(), s.getVoteNum());
	        }
	        dto.setSillage(sillageMap);

	        Map<String, Integer> longevityMap = new HashMap<>();
	        for (LongevityDto l : dao.selectLongevityByPerfumeId(pfId)) {
	            longevityMap.put(l.getLength(), l.getVoteNum());
	        }
	        dto.setLongevity(longevityMap);

	        // notes
	        Map<String, List<String>> notesMap = new LinkedHashMap<>();
	        for (NotesDto n : dao.selectNotesByPerfumeId(pfId)) {
	            if (n == null || n.getType() == null || n.getName() == null) continue;
	            notesMap.computeIfAbsent(n.getType(), k -> new ArrayList<>()).add(n.getName());
	        }
	        dto.setNotes(notesMap);
	        
	        // dayNight 정보
	        Map<String, Integer> dayNightMap = new LinkedHashMap<>();
	        for(DayNightDto dn: dao.selectDayNightByPerfumeId(pfId)) {
	        	dayNightMap.put(dn.getDayNight(), dn.getWeight());
	        }
	        dto.setDayNight(dayNightMap);
	        
	        // season 정보
	        Map<String, Integer> seasonMap = new LinkedHashMap<>();
	        for(SeasonDto s: dao.selectSeasonByPerfumeId(pfId)) {
	        	seasonMap.put( s.getSeason(), s.getWeight());
	        }
	        dto.setSeason(seasonMap);
	        
	        
	        // 2) 사용자 노트와 교집합
	        Map<String, List<String>> hit = new LinkedHashMap<>();
	        int hitCount = 0;

	        List<String> topHit = notesMap.getOrDefault("top", List.of()).stream()
	                .filter(uTop::contains)
	                .collect(Collectors.toList());
	        hit.put("top", topHit);
	        hitCount += topHit.size();

	        List<String> midHit = notesMap.getOrDefault("middle", List.of()).stream()
	                .filter(uMiddle::contains)
	                .collect(Collectors.toList());
	        hit.put("middle", midHit);
	        hitCount += midHit.size();

	        List<String> baseHit = notesMap.getOrDefault("base", List.of()).stream()
	                .filter(uBase::contains)
	                .collect(Collectors.toList());
	        hit.put("base", baseHit);
	        hitCount += baseHit.size();

	        if (hitCount > 0) {
	            PerfumeWithMatch with = new PerfumeWithMatch();
	            BeanUtils.copyProperties(dto, with);
	            with.setUserNoteMatch(hit);
	            with.setNoteMatchCount(hitCount);
	            
	            Map<String, List<String>> matchNotesMap = new LinkedHashMap<>();
	            matchNotesMap.put("top", topHit);
	            matchNotesMap.put("middle", midHit);
	            matchNotesMap.put("base", baseHit);
	            with.setMatchNotes(matchNotesMap);
	            
	            matched.add(with);
	        } else {
	            noMatched.add(dto);
	        }
	    }
	    
	    Map<String, Object> res = new LinkedHashMap<>();
	    res.put("Match", matched);
	    res.put("NoMatch",noMatched);
	    
	    return res;
	    
	    //return new AccordCompareResponse(matched, noMatched);
	}

	/**
	 * Mood 대분류 선택
	**/
	@Override
	public List<Map<Integer, String>> getCategory() throws SQLException {
	    return dao.selectCategoryInfo();
	}
	
	/** 
	 * Mood 대분류 및 소분류 조합 선택
	 * **/
	@Override
	public List<CategoryMoodDto> getCategoryMood() throws SQLException{
		return dao.selectCategoryMoodInfo();
	}
	
	
	/**
	 *  Mood에 따른 Accord 합 가중치를 내림차순으로 정렬하고, 상위 12개의 Accord를 전달한다.
	 * **/
	@Override
	public List<MoodAccordDto> calculateAccordWithMood(List<Integer> moodIdList) {
		List<MoodAccordDto> moodAccords = dao.selectMoodAccords(moodIdList);
		
		return moodAccords;
	}


	
	/**
	 * Accord <-> Note 상관관계가 높은 note만 뽑는다.
	 * */
	@Override
	public List<NotesDto> getDeterminedNotes(int perfumeId) {
		List<NotesDto> result = dao.selectDeterminedNotes(perfumeId);
		
		return result;
	}

	/**
	 * 사용자 보유 Note를 반환한다.
	 **/
	@Override
	public List<NotesDto> getUserNotes(String userId) {
		List<NotesDto> userNotes = dao.selectUserNotes(userId);
		
		return userNotes;
	}

	/**
	 * 사용자 보유 Note를 추가한다.
	 * @throws SQLException 
	 **/
	@Override
	public int insertUserNote(UserNoteDto userNote) throws SQLException {
		
		int result = dao.insertUserNote(userNote);
		if (result == 0) throw new SQLException();  
		
		return result;
	}
	
	/**
	 * 사용자 보유 Note를 삭제한다.
	 * @throws SQLException 
	 * **/
	@Override
	public int deleteUserNote(String userId, String noteName) throws SQLException {
		
		int result = dao.deleteUserNote(userId, noteName);
		if (result == 0 ) throw new SQLException();
		return result;
	}

	/**
	 * 노트 일부만 담고 있는 향수를 검색한다.(최대 500개 반환 후 Service에서 개수 통제)
	 * noteList을 입력값으로 넣으면, perfumeId 반환.
	 * perfumeId 이용해 전체 perfumeWrapper List 반환.
	 * @throws SQLException 
	 * **/
	@Override
	public List<PerfumeWrapper> selectPerfumeByNote(List<String> noteList) throws SQLException{
		// noteList 및 listSize입력 시, perfumeId 반환.
		// myBatis에서 listSize 반환 오류로 인해, service에서 추출.
		int listSize = noteList.size();
		List<Integer> searchedPerfumes = dao.selectPerfumeByNotes(noteList, listSize);
		
		// perfumeId 이용해 전체 PerfumeWrapper List 반환.
		int restrictCount = 100;
		int count = 0;
		List<PerfumeWrapper> searchResult = new ArrayList<>(); 
		for(Integer perfume: searchedPerfumes) {
			int perfumeId = perfume;
			searchResult.add(getPerfumeWrapper(perfumeId));
			count++;
			if( count== RESTRICT_COUNT) break;
		}
		
		return searchResult;
	}
	
	
	public List<PerfumeWrapperExtended> getPerfumeWrapperExtended(int id, List<String> noteList, int minCount) throws SQLException{
		
		PerfumeWrapper baseInfo = getPerfumeWrapper(id);
		
		List<PerfumeWrapperExtended> extendedInfo = dao.selectPerfumeByNotesAtLeastMin(noteList, minCount);
		return null;
	}
	
	
	/**
	 * 모든 노트를 담고 있는 향수를 검색한다.(최대 500개 반환 후 Service에서 개수 통제) 
	 **/
	@Override
	public List<PerfumeWrapperExtended> selectPerfumeByAtLeastKNotes(List<String> noteList) throws SQLException{
		// Perfume의 Note가 noteList 내 MinCount이상 들어 있는, perfumeId를 반환한다.
		List<PerfumeWrapperExtended> hits = dao.selectPerfumeByNotesAtLeastMin(noteList, MIN_COUNT);
		
		int count = 0;
		List<PerfumeWrapperExtended> searchResult = new ArrayList<>();
		for(PerfumeWrapperExtended hit: hits) {
			int perfumeId = hit.getMatchId();
			
			System.out.println(hit.getMatchedNotesJson());
			
			// perfume 기본 정보를 가져온다.
			PerfumeWrapper baseInfo = getPerfumeWrapper(perfumeId);
			
			// JSON String -> List<String> 정보를 Parsing해서 쓴다.
			List<String> matchedNotes = parseNotes(hit.getMatchedNotesJson());
			
			// noteMatchCount, MatchedNotes 정보를 추가한다.
			PerfumeWrapperExtended ext = PerfumeWrapperExtended.of(baseInfo, perfumeId, hit.getMatchCount(), matchedNotes);
			
			// 검색 정보 List에 추가한다.
			searchResult.add(ext);
			
			count++;
			if( count == RESTRICT_COUNT ) break;
		}
		return searchResult;
	}
	
	
}
