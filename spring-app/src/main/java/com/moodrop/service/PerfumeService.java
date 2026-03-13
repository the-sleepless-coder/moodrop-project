package com.moodrop.service;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.moodrop.entity.*;
import com.moodrop.DTO.PerfumeDetailDto;
import com.moodrop.DTO.PerfumeLikeRankingDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.ZSetOperations;
import com.moodrop.repository.PerfumeBasicRepository;
import com.moodrop.repository.PerfumeCommentRepository;
import com.moodrop.repository.PerfumeDayNightRepository;
import com.moodrop.repository.PerfumeLongevityRepository;
import com.moodrop.repository.PerfumeMainAccordRepository;
import com.moodrop.repository.PerfumeNoteRepository;
import com.moodrop.repository.PerfumeSeasonRepository;
import com.moodrop.repository.PerfumeSillageRepository;
import com.moodrop.repository.PerfumeLikeRepository;
import com.moodrop.repository.UserRepository;
import com.moodrop.utils.RedisPerfumeKeys;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moodrop.elasticsearch.AutocompleteDto;
import com.moodrop.elasticsearch.ElasticSearchService;
import com.moodrop.model.dao.PerfumeDao;
import com.moodrop.model.dao.UserDao;
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

import lombok.RequiredArgsConstructor;


@Slf4j
@Service
@RequiredArgsConstructor
public class PerfumeService {
	
	private final PerfumeDao dao;
	private final PerfumeBasicRepository perfumeBasicRepository;
	private final PerfumeCommentRepository perfumeCommentRepository;
	private final PerfumeNoteRepository perfumeNoteRepository;
	private final PerfumeMainAccordRepository perfumeMainAccordRepository;
	private final PerfumeDayNightRepository perfumeDayNightRepository;
	private final PerfumeLongevityRepository perfumeLongevityRepository;
	private final PerfumeSillageRepository perfumeSillageRepository;
	private final PerfumeSeasonRepository perfumeSeasonRepository;
	private final PerfumeLikeRepository perfumeLikeRepository;
	private final UserRepository userRepository;
	private final UserDao userDao;
	private final StringRedisTemplate redisTemplate;
	private final ElasticSearchService elasticSearchService;
	private final ApplicationEventPublisher eventPublisher;

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
	 주어진 Perfume Id에 대한 전체(기본+구체적인)정보 조회
	 **/
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
		Map<String, List<String>> notesEnglishMap = new LinkedHashMap<>();
		Map<String, List<String>> notesKoreanMap = new LinkedHashMap<>();
        for(NotesDto n: notesList) {
        	String type = n.getType().toLowerCase();
        	
        	// type 별로 Map 생성. 
        	// Map안에 type이 있으면, 해당 List에 note를 넣어준다.
        	if(!notesEnglishMap.containsKey(type)) {
        		notesEnglishMap.put(type, new ArrayList<>());
        	}
        	notesEnglishMap.get(type).add(n.getName().trim());
        	
        	if(!notesKoreanMap.containsKey(type)) {
        		notesKoreanMap.put(type, new ArrayList<>());
        	}
        	
        	notesKoreanMap.get(type).add(n.getKoreanName().trim());
        	
        }
        
        
		PerfumeWrapper perfumeWrapper = new PerfumeWrapper(basic, dayNightInfo, longevityInfo, mainAccord, notesEnglishMap, notesKoreanMap,seasonInfo, sillageInfo);
		
		return perfumeWrapper;
	}

	
	/** 사용자가 보유한 노트 기준으로 필터
	Accord 로 걸러낸 향수를, 사용자가 갖고 있는 note기준으로 나눈다.
	**/
	public Map<String, Object> filterByAccordWithUserNotes(
	        String userId,            
	        List<String> accords
	) throws SQLException {

	    // DB에서 사용자 노트 기준 -> Determined Notes의 향수를 찾는다.
	    List<NotesDto> userNotesList = dao.selectUserNotes(userId);
	    
	    // Map<String, List<String>> 형태로 변환
	    Map<String, List<String>> userNotes = new LinkedHashMap<>();
	    Set<String> uAll = new LinkedHashSet<>();
	    for (NotesDto n : userNotesList) {
	        if (n == null || n.getType() == null || n.getName() == null) continue;
	        userNotes.computeIfAbsent(n.getType(), k -> new ArrayList<>()).add(n.getName());
	        
	        String noteName = n.getName();
	        uAll.add(noteName);
	    }

	    // Set으로 변환(중복 제거만)
	    // Set<String> userNotesSet = new HashSet<>(userNotes.get("top"));
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
	        PerfumeExtendedDto ExtendedDto = new PerfumeExtendedDto();
	        BeanUtils.copyProperties(basic, ExtendedDto);
	        ExtendedDto.setAccordMatchCount(p.getAccordMatchCount());
	        
	        Map<String, Integer> sillageMap = new HashMap<>();
	        for (SillageDto s : dao.selectSillageByPerfumeId(pfId)) {
	            sillageMap.put(s.getStrength(), s.getVoteNum());
	        }
	        ExtendedDto.setSillage(sillageMap);

	        Map<String, Integer> longevityMap = new HashMap<>();
	        for (LongevityDto l : dao.selectLongevityByPerfumeId(pfId)) {
	            longevityMap.put(l.getLength(), l.getVoteNum());
	        }
	        ExtendedDto.setLongevity(longevityMap);

	        // notes
	        Map<String, List<String>> notesMap = new LinkedHashMap<>();
	        for (NotesDto n : dao.selectNotesByPerfumeId(pfId)) {
	            if (n == null || n.getType() == null || n.getName() == null) continue;
	            notesMap.computeIfAbsent(n.getType(), k -> new ArrayList<>()).add(n.getName());
	        }
	        ExtendedDto.setNotes(notesMap);
	        
	        // dayNight 정보
	        Map<String, Integer> dayNightMap = new LinkedHashMap<>();
	        for(DayNightDto dn: dao.selectDayNightByPerfumeId(pfId)) {
	        	dayNightMap.put(dn.getDayNight(), dn.getWeight());
	        }
	        ExtendedDto.setDayNight(dayNightMap);
	        
	        // season 정보
	        Map<String, Integer> seasonMap = new LinkedHashMap<>();
	        for(SeasonDto s: dao.selectSeasonByPerfumeId(pfId)) {
	        	seasonMap.put( s.getSeason(), s.getWeight());
	        }
	        ExtendedDto.setSeason(seasonMap);
	        
	        
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
	            BeanUtils.copyProperties(ExtendedDto, with);
	            with.setUserNoteMatch(hit);
	            with.setNoteMatchCount(hitCount);
	            
	            Map<String, List<String>> matchNotesMap = new LinkedHashMap<>();
	            matchNotesMap.put("top", topHit);
	            matchNotesMap.put("middle", midHit);
	            matchNotesMap.put("base", baseHit);
	            with.setMatchNotes(matchNotesMap);
	            
	            matched.add(with);
	        } else {
	            noMatched.add(ExtendedDto);
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

	public List<Map<Integer, String>> getCategory() throws SQLException {
	    return dao.selectCategoryInfo();
	}
	
	/** 
	 * Mood 대분류 및 소분류 조합 선택
	 * **/
	public List<CategoryMoodDto> getCategoryMood() throws SQLException{
		return dao.selectCategoryMoodInfo();
	}
	
	
	/**
	 *  Mood에 따른 Accord 합 가중치를 내림차순으로 정렬하고, 상위 12개의 Accord를 전달한다.
	 * **/
	public List<MoodAccordDto> calculateAccordWithMood(List<Integer> moodIdList) {
		List<MoodAccordDto> moodAccords = dao.selectMoodAccords(moodIdList);
		
		return moodAccords;
	}
	
	/**
	 * Accord <-> Note 상관관계가 높은 note만 뽑는다.
	 * */
	public List<NotesDto> getDeterminedNotes(int perfumeId) {
		List<NotesDto> result = dao.selectDeterminedNotes(perfumeId);
		
		for(NotesDto note: result) {
			note.setKoreanName(note.getKoreanName().trim());
		}
		return result;
	}

	/**
	 * 사용자 보유 Note를 반환한다.
	 **/
	public List<NotesDto> getUserNotes(String userId) {
		List<NotesDto> userNotes = dao.selectUserNotes(userId);
		// 한국어 공백 문자 처리 후 userNote 전달.
		for(NotesDto userNote: userNotes) {
			String koreanName = userNote.getKoreanName();
			if(koreanName != null) {
				userNote.setKoreanName(koreanName.trim());  				
			}
		}
		return userNotes;
	}

	/**
	 * 사용자 보유 Note를 추가한다.
	 * @throws SQLException 
	 **/
	@Transactional
	public int insertUserNote(UserNoteDto userNote) throws SQLException {
		// 1. Race condition 방지를 위한 lockUserRow를 불러온다.
		int userIdInt = userDao.selectUserByString(userNote.getUserId());
		dao.lockUserRow(userIdInt);
		
		// 2.user가 보유한 note의 개수를 확인한다.
		String userIdString = userNote.getUserId();
		List<NotesDto> userNoteList = dao.selectUserNotes(userIdString);
		
		// 보유 노트가 8개 이상이면 insert를 멈추게 한다.
		int cnt = userNoteList.size();
		if(cnt >= 8) {
			throw new IllegalStateException("보유 가능한 노트는 최대 8개 입니다.");
		}
		
		int result = dao.insertUserNote(userNote);
		if (result == 0) throw new SQLException();  
		
		return result;
	}
	
	/**
	 * 사용자 보유 Note를 삭제한다.
	 * @throws SQLException 
	 * **/
	public int deleteUserNote(String userId, String noteName) throws SQLException {
		
		int result = dao.deleteUserNote(userId, noteName);
		if (result == 0 ) throw new SQLException();
		return result;
	}

	/**
	 * 노트 일부라도 담고 있는 향수를 검색한다.(최대 500개 반환 후 Service에서 개수 통제)
	 * noteList을 입력값으로 넣으면, perfumeId 반환.
	 * perfumeId 이용해 전체 perfumeWrapper List 반환.
	 * @throws SQLException 
	 * **/
	public List<PerfumeWrapper> selectPerfumeByNote(List<String> noteList) throws SQLException{
		// noteList 및 listSize입력 시, perfumeId 반환.
		// myBatis에서 listSize 반환 오류로 인해, service에서 추출.
		int listSize = noteList.size();
		List<Integer> searchedPerfumes = dao.selectPerfumeByNotes(noteList, listSize);
		
		// perfumeId 이용해 전체 PerfumeWrapper List 반환.
		int count = 0;
		List<PerfumeWrapper> searchResult = new ArrayList<>(); 
		for(Integer perfume: searchedPerfumes) {
			int perfumeId = perfume;
			
			PerfumeWrapper perfumeWrapper = getPerfumeWrapper(perfumeId);
			searchResult.add(perfumeWrapper);
			count++;
			if( count== RESTRICT_COUNT) break;
		}
		
		return searchResult;
	}
	
	
	/**
	 * 입력한 모든 노트를 담고 있는 향수를 검색한다.(최대 500개 반환 후 Service에서 개수 통제)
	 **/
	public List<PerfumeWrapperExtended> selectPerfumeByAtLeastKNotes(List<String> noteList) throws SQLException{
		// Perfume의 Note가 noteList 내 MinCount 이상 들어 있는, perfumeId를 반환한다.
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
	
	// 전체 향수에 대해서 확정된 Note 비율에 대한 데이터를 가져온다.
	public List<NotesDto> getAllDeterminedNotes(){
		List<NotesDto> determinedNotesList = dao.selectDeterminedNotesList();
		
		for(NotesDto note: determinedNotesList) {
			note.setKoreanName(note.getKoreanName().trim());
		}
		
		return determinedNotesList;
	}


	public List<PerfumeWrapperExtended> getPerfumeWrapperExtended(int id, List<String> noteList, int minCount) throws SQLException{
		
		PerfumeWrapper baseInfo = getPerfumeWrapper(id);
		
		List<PerfumeWrapperExtended> extendedInfo = dao.selectPerfumeByNotesAtLeastMin(noteList, minCount);
		return null;
	}

	// String에서 공백 처리를 DB형식에 맞게 처리해준다.
	// String -> Id를 찾아서 활용한 정보를 반환한다.
	public PerfumeWrapper getPerfumeInfo(String perfumeName) throws SQLException {
		// NPE를 피하기 위한 Optional 객체 사용.
		// 값이 존재하지 않으면 예외를 던진다.
		// DB는 공백을 '-'로 저장하므로 변환한다.
		String normalizedName = perfumeName.trim().replaceAll("\\s+", "-");

		Optional<Integer> perfumeIdOpt = perfumeBasicRepository.findIdByName(normalizedName);

		int perfumeId = perfumeIdOpt.orElseThrow(()->new NoSuchElementException("Perfume Does not Exist"));

		PerfumeWrapper perfumeInfo = getPerfumeWrapper(perfumeId);

		return perfumeInfo;
	}

	// Controller에서 필요한 인자를 받아서 Service 계층에서 처리한다.
	// 그냥 바로 comment만 조회해서 가져온다. 
	// 전체 데이터를 다 받아와서 처리할 필요가 없다. 
	public List<String> getPerfumeComments(String perfumeName) throws SQLException {
		String normalizedName = perfumeName.trim().replaceAll("\\s+", "-");
		Optional<Integer> perfumeIdOpt = perfumeBasicRepository.findIdByName(normalizedName);

		long perfumeId = perfumeIdOpt.orElseThrow(() -> new NoSuchElementException("Perfume Does not Exist"));

		List<String> comments = perfumeCommentRepository.findCommentString(perfumeId);

		return comments;
	}

	/**
	 * 향수 상세 정보를 PerfumeDetailDto 형태로 반환한다.
	 * (notes 플랫 리스트, accords 리스트, comments eng/ko 텍스트 블럭)
	 * Elastic Search에 넣는 용도로 활용하기 위함.
	 * */
	public PerfumeDetailDto getPerfumeDetail(int id) {
		Perfumes perfume = perfumeBasicRepository.findByIdWithBasics(id)
				.orElseThrow(() -> new NoSuchElementException("Perfume not found: " + id));

		// notes: flat list [{name, type}]
		List<PerfumeNote> perfumeNotes = perfumeNoteRepository.findByPerfumeId(id);
		Stream<PerfumeNote> perfumeNoteStream = perfumeNotes.stream();
		List<PerfumeDetailDto.NoteDto> noteDtos = perfumeNoteStream
				.map(pn -> new PerfumeDetailDto.NoteDto(
						pn.getNote().getName(),
						pn.getNote().getType().name()))
				.collect(Collectors.toList());

		// accords: [{name, weight}]
		List<PerfumeMainAccord> accords = perfumeMainAccordRepository.findByPerfumeId(id);
		List<PerfumeDetailDto.AccordDto> accordDtos = accords.stream()
				.map(pma -> new PerfumeDetailDto.AccordDto(
						pma.getAccord().getName(),
						pma.getWeight()))
				.collect(Collectors.toList());

		// comments: \n으로 이어붙인 텍스트 블럭
		long perfumeIdLong = (long) id;
		String commentsEng = String.join("\n", perfumeCommentRepository.findCommentString(perfumeIdLong));
		String commentsKo  = String.join("\n", perfumeCommentRepository.findCommentKoString(perfumeIdLong));

		// dayNight: weight 기준 top 1
		List<PerfumeDayNight> dayNights = perfumeDayNightRepository.findTopByPerfumeId(id, PageRequest.of(0, 1));
		PerfumeDetailDto.DayNightDto dayNightDto = dayNights.isEmpty() ? null :
				new PerfumeDetailDto.DayNightDto(dayNights.get(0).getDayNight(), dayNights.get(0).getWeight());

		// longevity: vote_num 기준 top 1
		List<PerfumeLongevity> longevities = perfumeLongevityRepository.findTopByPerfumeId(id, PageRequest.of(0, 1));
		PerfumeDetailDto.LongevityDto longevityDto = longevities.isEmpty() ? null :
				new PerfumeDetailDto.LongevityDto(longevities.get(0).getLongevityInfo().getLength(), longevities.get(0).getVoteNum());

		// sillage: vote_num 기준 top 1
		List<PerfumeSillage> sillages = perfumeSillageRepository.findTopByPerfumeId(id, PageRequest.of(0, 1));
		PerfumeDetailDto.SillageDto sillageDto = sillages.isEmpty() ? null :
				new PerfumeDetailDto.SillageDto(sillages.get(0).getSillageInfo().getStrength(), sillages.get(0).getVoteNum());

		// season: weight 기준 top 1
		List<PerfumeSeason> seasons = perfumeSeasonRepository.findTopByPerfumeId(id, PageRequest.of(0, 1));
		PerfumeDetailDto.SeasonDto seasonDto = seasons.isEmpty() ? null :
				new PerfumeDetailDto.SeasonDto(seasons.get(0).getSeason(), seasons.get(0).getWeight());

		PerfumeDetailDto.RatingDto ratingDto = new PerfumeDetailDto.RatingDto(
				perfume.getRating().getRatingVal(),
				perfume.getRating().getRatingCount());

		PerfumeDetailDto dto = new PerfumeDetailDto();
		dto.setId(perfume.getId());
		dto.setName(perfume.getName());
		dto.setBrand(perfume.getBrand().getName());
		dto.setRating(ratingDto);
		dto.setDescription(perfume.getDescription());
		dto.setDescriptionKo(perfume.getDescriptionKo());
		dto.setGender(perfume.getGender());
		dto.setCountry(perfume.getCountry().getCountry());
		dto.setYear(perfume.getYear());
		dto.setNotes(noteDtos);
		dto.setAccords(accordDtos);
		dto.setCommentsEng(commentsEng);
		dto.setCommentsKo(commentsKo);
		dto.setDayNight(dayNightDto);
		dto.setLongevity(longevityDto);
		dto.setSillage(sillageDto);
		dto.setSeason(seasonDto);
		return dto;
	}

	// 실시간 자동 완성을 위해서 일부 글자를 입력했을 때,
	// 나머지 문자열도 보여준다.
	public Object autoSuggestions( String input ){

		return null;
	}


	/** 조건에 대한 검색 구현 */
	public Object findDetailedSearch(String language, String query, String type){
		
		if(language.equals("KO")){
			if(type.equals("comment")){
				
				
			}else if(type.equals("description")){
				

			}

		}else if(language.equals("ENG")){
			if(type.equals("comment")){
				

			}else if(type.equals("description")){
				


			}


		}


		return null;

	}

	/**
	 * 향수 좋아요 / 취소 토글
	 * @return true = 좋아요 등록, false = 좋아요 취소
	 *
	 * like() → INSERT IGNORE 반환값: 1 = 실제 삽입, 0 = 이미 존재(중복 무시)
	 * unlike() → DELETE 반환값:     1 = 실제 삭제, 0 = 존재하지 않아 삭제 없음
	 * 두 경우 모두 반환값 > 0 일 때만 likeCount와 Redis를 갱신해 이중 처리를 방지한다.
	 */
	@Transactional
	public boolean likePerfume(String userIdString, int perfumeId) {
		User user = userRepository.findByUserId(userIdString)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

		int userId = user.getId();
		PerfumeLikeId likeId = new PerfumeLikeId(userId, perfumeId);
		String perfumeLikeKey = RedisPerfumeKeys.perfumeLikeDailyRank(LocalDate.now());

		if (perfumeLikeRepository.existsById(likeId)) {
			// 이미 좋아요 → 취소 시도, 실제로 삭제된 경우(1)에만 후속 처리
			// redis에서 중복 처리 방지를 위한 deleted 반환값 활용.
			int deleted = perfumeLikeRepository.unlike(userId, perfumeId);
			if (deleted > 0) {
				perfumeBasicRepository.decrementLikeCount(perfumeId);
				redisTemplate.opsForZSet().incrementScore(perfumeLikeKey, String.valueOf(perfumeId), -1);
				redisTemplate.expire(perfumeLikeKey, 1, TimeUnit.DAYS);

			}
			return false;
		} else {
			// 좋아요 등록 시도, 실제로 삽입된 경우(1)에만 후속 처리
			// redis에서 중복 처리 방지를 위한 inserted 반환값 활용.
			Perfumes perfume = perfumeBasicRepository.findById(perfumeId)
					.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 향수입니다."));

			int inserted = perfumeLikeRepository.like(userId, perfumeId);
			if (inserted > 0) {
				perfumeBasicRepository.incrementLikeCount(perfumeId);
				redisTemplate.opsForZSet().incrementScore(perfumeLikeKey, String.valueOf(perfumeId), 1);
				redisTemplate.expire(perfumeLikeKey, 1, TimeUnit.DAYS);

			}
			return true;
		}


	}

	/**
	 * Redis ZSet 기반 향수 좋아요 랭킹 조회 (당일 기준, 상위 50개)
	 */
	public List<PerfumeLikeRankingDto> likedPerfumeRanking() {
		String dailyKey = RedisPerfumeKeys.perfumeLikeDailyRank(LocalDate.now());

		Set<ZSetOperations.TypedTuple<String>> resultRedis =
				redisTemplate.opsForZSet().reverseRangeWithScores(dailyKey, 0, 49);

		if (resultRedis == null || resultRedis.isEmpty()) {
			return Collections.emptyList();
		}

		List<PerfumeLikeRankingDto> result = new ArrayList<>();
		for (ZSetOperations.TypedTuple<String> tuple : resultRedis) {
			Integer perfumeId = Integer.parseInt(tuple.getValue());
			Optional<Perfumes> perfumeOptional = perfumeBasicRepository.findById(perfumeId);

			if(perfumeOptional.isEmpty()){
				continue;
			}

			Perfumes perfume = perfumeOptional.get();

			Integer likeCount = tuple.getScore().intValue();

			result.add(new PerfumeLikeRankingDto(perfumeId, perfume.getName(), likeCount));
		}

		return result;
	}

	// 사용자별 검색한 향수 검색 기록 및 일별 검색한 향수 랭킹을 반영해준다.
	public boolean searchPerfume(String userIdStr, int perfumeId){
		// try-catch로 boolean을 반환해서 해당 코드의 실행 결과 반영.
		try{
			Integer userIdInt = userRepository.findIdByUserIdStr(userIdStr).orElseThrow();

			// 사용자별 검색한 향수 검색 기록.
			String userRecentSearchKeys = RedisPerfumeKeys.usersRecentlySearchedPerfumes(userIdInt);

			// 사용자별 검색한 향수 횟수.
			String userPerfumeCountKey =  RedisPerfumeKeys.userPerfumeSearchCountKey(userIdInt);

			// 일별 검색한 향수 랭킹
			String dailySearchedPerfumeKeys = RedisPerfumeKeys.dailySearchedPerfumesRanking(LocalDate.now());

			//-----------------------------------
			// 사용자가 향수를 검색한 마지막 시간을 기록한다.
			redisTemplate.opsForZSet().add(userRecentSearchKeys, String.valueOf(perfumeId), System.currentTimeMillis());
			redisTemplate.expire(userRecentSearchKeys, 2, TimeUnit.DAYS);

			// 사용자별 검색한 향수 횟수.
			redisTemplate.opsForHash().increment(
					userPerfumeCountKey,
					String.valueOf(perfumeId),
					1
			);

			// 일별로 사용자들이 검색한 향수 횟수를 반영한다.
			redisTemplate.opsForZSet().incrementScore(dailySearchedPerfumeKeys, String.valueOf(perfumeId), 1);
			redisTemplate.expire(dailySearchedPerfumeKeys, 2, TimeUnit.DAYS);

			return true;
		}catch(Exception e){
			log.error("searchPerfume redis 반영 실패. userIdStr={}, perfumeId={}", userIdStr, perfumeId, e);
			return false;
		}


	}


	/**
	 * 향수 데이터를 추가한다.
	 * 이미지 리사이징을 실행순서 제어를 위한 동기화 및 언어 번역 파이프라인 비동기적으로 처리
	 * DB에 데이터 넣기 -> S3에 이미지 리 사이징해서 넣기.
	 *
	 * */
	@Transactional
	public int createPerfume(){
		/**
		Perfumes perfume = perfumeBasicRepository.save(


		);

		eventPublisher.publishEvent(perfume.getId());
		 */
		return 1;

	}



}