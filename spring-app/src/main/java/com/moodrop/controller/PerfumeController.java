package com.moodrop.controller;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import com.moodrop.DTO.PerfumeBasicDto;
import com.moodrop.entity.Perfumes;
import com.moodrop.repository.PerfumeBasicRepository;
import com.moodrop.service.PerfumeImportService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.tomcat.util.http.parser.Authorization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.moodrop.model.dto.CategoryMoodDto;
import com.moodrop.model.dto.MoodAccordDto;
import com.moodrop.model.dto.NotesDto;
import com.moodrop.DTO.PerfumeDetailDto;
import com.moodrop.DTO.PerfumeLikeRankingDto;
import com.moodrop.model.dto.PerfumeWrapper;
import com.moodrop.model.dto.PerfumeWrapperExtended;
import com.moodrop.model.dto.UserNoteDto;
import com.moodrop.service.PerfumeService;
import com.moodrop.elasticsearch.AutocompleteDto;
import com.moodrop.elasticsearch.ElasticBulkService;
import com.moodrop.elasticsearch.ElasticSearchService;
import com.moodrop.elasticsearch.PerfumeEsDocument;
import com.moodrop.elasticsearch.PerfumeFilterRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.ApplicationEventPublisher;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PerfumeController {

	PerfumeService service;
	ElasticBulkService elasticBulkService;
	ElasticSearchService elasticSearchService;
	PerfumeImportService importService;


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
	 * 사용자가 선택한 감정 기준 확정된 Accord를 기반으로, Perfume 선택
	 * 그리고 선택된 향수 중에서 user가 보유한 노트 기준으로 분류
	 * Accord가 최대 12개까지 늘어날 수 있기 때문에, Body에 Accord 담에서 보냄. 
	 * */
	@PostMapping("/perfume/accord/{userId}")
	public ResponseEntity<?> filterByAccordAndUserNotes(HttpServletRequest request, HttpServletResponse response, @PathVariable String userId, @RequestBody Map<String,List<String>> body) throws SQLException{
		try {
			List<String> accordList = body.get("accords");
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
		try {
			List<Map<Integer,String>> category = service.getCategory();
			return ResponseEntity.ok(category);			
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
		
	}
	
	// 대분류 내 소분류 가져오기(Category 내 Mood 가져오기)
	@GetMapping("/categoryMood")
	public ResponseEntity<?> getCategoryMood(HttpServletRequest request, HttpServletResponse response) throws SQLException{
		try {
			List<CategoryMoodDto> categoryMood = service.getCategoryMood();
			return ResponseEntity.ok(categoryMood);			
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	// Mood를 선택한 것에 대한 Accord를 반환한다.
	// Accord 가중치 합이 가장 높은 12개를 가져온다.
	@GetMapping("/perfume/accord")
	public ResponseEntity<?> getAccordByMood(@RequestParam("moodId") List<Integer> moodIdList, HttpServletRequest request, HttpServletResponse response) throws SQLException{		
		try{
			// moodId라는 키를 갖고 있는 값을, 바로 List로 만든다.
			List<MoodAccordDto> moodAccords = service.calculateAccordWithMood(moodIdList);
			return ResponseEntity.ok(moodAccords);
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	// Perfume에서 Accord <-> Note 상관관계가 높은 Note만 뽑아낸다. 
	@GetMapping("/perfume/selectNote/{perfumeId}") 
	public ResponseEntity<?> selectHighestWeightNote(@PathVariable("perfumeId") int perfumeId, HttpServletRequest request, HttpServletResponse response){		
		try {
			List<NotesDto> result = service.getDeterminedNotes(perfumeId);
			if(!result.isEmpty()) {
				return ResponseEntity.ok(result);				
			}else {
				return ResponseEntity.ok("Perfume does not exist");
			}
		}catch(Exception e){
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
			
		}
	}

	// 사용자의 보유 노트를 확인한다.
	@GetMapping("/perfume/note/{userId}")
	public ResponseEntity<?> getUserNotes(@PathVariable("userId") String userId, HttpServletRequest request, HttpServletResponse response){
		
		try {
			List<NotesDto> userNotes = service.getUserNotes(userId);
			
			return ResponseEntity.ok(userNotes);
		}catch(Exception e){
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
		
	}
	
	// 사용자의 보유 Note를 추가한다.
	@PostMapping("/perfume/note")
	public ResponseEntity<?> postUserNotes(@RequestBody UserNoteDto UserNoteDto ,HttpServletRequest request, HttpServletResponse response){
		
		try {
			int result = service.insertUserNote(UserNoteDto);
			return ResponseEntity.ok(result);
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	// 사용자의 보유 Note를 삭제한다.
	@DeleteMapping("/perfume/note")
	public ResponseEntity<?> deleteUserNote(@RequestParam String userId, @RequestParam String noteName, HttpServletRequest request, HttpServletResponse response){
		
		try {
			int result = service.deleteUserNote(userId, noteName);
			if(result == 1) {
				return ResponseEntity.ok("Successfully Deleted");
			}else {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Note Not Found");
			}
				 
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
		
	}
	
	/**
	 * 입력한 노트 일부라도 담고 있는 향수를 검색한다.
	 * **/
	@PostMapping("/perfume/searchPartNote")
	public ResponseEntity<?> searchPerfumeByNote(@RequestBody Map<String, List<String>> noteList, HttpServletRequest request, HttpServletResponse response ) throws SQLException{
		
		try {
			List<String> extractedNoteList = noteList.get("noteList");
			List<PerfumeWrapper>searchResult = service.selectPerfumeByNote(extractedNoteList);

			return ResponseEntity.ok(searchResult);
			
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
		
	}
	
	/**
	 * 입력한 모든 노트를 담고 있는 향수를 검색한다.
	 * **/
	@PostMapping("/perfume/searchAllNote")
	public ResponseEntity<?> searchPerfumeByAllnote(@RequestBody Map<String, List<String>> noteList, HttpServletRequest request, HttpServletResponse response){
		
		try {
			List<String> extractedNoteList= noteList.get("noteList");
			List<PerfumeWrapperExtended> searchResult = service.selectPerfumeByAtLeastKNotes(extractedNoteList);
			
			return ResponseEntity.ok(searchResult);
			
		}catch(Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
			
		}
		
	}
	
	// 전체 확정된 노트 리스트를 반환한다.
	@GetMapping("/perfume/getAllDeterminedNotes")
	public ResponseEntity<?> getUserNotes(HttpServletRequest request, HttpServletResponse response){
		
		try {
			List<NotesDto> allDeterminedNotes = service.getAllDeterminedNotes();
			
			return ResponseEntity.ok(allDeterminedNotes);
		}catch(Exception e) {
			
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); 
		}
	}

	// perfume 검색에 대한 기본 정보 반환.
	// String -> Id로 변환해서 DB에서 찾아진다.
	// 이미 Id로 검색하는 것이 있기 때문에, String ->Id로 변환해주기만 하면 된다.
	@GetMapping("/perfume/getInfo")
	public ResponseEntity<?> getPerfumeInfo(@RequestParam String perfumeName) {
		// 예외 처리를 통해 perfume이 존재하지 않을 때와,
		// DB에서 장애가 났을 때에 대한 처리를 해준다.
		try {
			PerfumeWrapper perfumeInfo = service.getPerfumeInfo(perfumeName);
			return ResponseEntity.ok(perfumeInfo);
		} catch (NoSuchElementException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Perfume not found: " + perfumeName);
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}


	// 향수 상세 정보 (notes 플랫, accords, comments eng/ko 텍스트 블럭)
	// 멀티 필드 조건 검색 및 자동완성에 사용
	// Elastic Search에 넣기 위함
	@GetMapping("/perfume/detail/{perfumeId}")
	public ResponseEntity<?> getPerfumeDetail(@PathVariable int perfumeId) {
		try {
			PerfumeDetailDto detail = service.getPerfumeDetail(perfumeId);
			return ResponseEntity.ok(detail);
		} catch (NoSuchElementException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Perfume not found");
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	// DB 전체 향수 데이터를 ES에 벌크 인덱싱한다.
	@PostMapping("/elastic/bulkIndex")
	public ResponseEntity<?> bulkIndexToElastic() {
		try {
			int count = elasticBulkService.bulkIndex();
			return ResponseEntity.ok("ES 인덱싱 완료: " + count + "개");
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("ES 인덱싱 실패: " + e.getMessage());
		}
	}

	// 특정 id에 대해서 RDB에 데이터를 넣고, Elastic Search에도 데이터를 넣어준다.
	public ResponseEntity<?> perfumeDataInsert(){

		return null;
	}

	// 특정 id 이후 향수만 추가 인덱싱한다. (증분)
	@PostMapping("/elastic/bulkIndexAfter/{fromId}")
	public ResponseEntity<?> bulkIndexAfter(@PathVariable int fromId) {
		try {
			int count = elasticBulkService.bulkIndexAfter(fromId);
			return ResponseEntity.ok("ES 증분 인덱싱 완료: " + count + "개 (id > " + fromId + ")");
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("ES 인덱싱 실패: " + e.getMessage());
		}
	}

	// 해당되는 perfume에 대한 comment를 반환한다.
	@GetMapping("/perfume/getComments")
	public ResponseEntity<?> getPerfumeComments(@RequestParam("name") String perfumeName){
		try{
			List<String> comments = service.getPerfumeComments(perfumeName);
			return ResponseEntity.ok(comments);

		}catch(NoSuchElementException e){
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Perfume not Found: "+ perfumeName);
		}
		catch(Exception e){
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	// comment 또는 description을 언어별로 ES에서 검색한다.
	// language: KO | ENG  /  type: comment | description
	@GetMapping("/perfume/detailedSearch")
	public ResponseEntity<?> getDetailedSearchResult(
			@RequestParam("language") String language,
			@RequestParam("q") String query,
			@RequestParam("type") String type) {
		try {
			List<PerfumeEsDocument> result = elasticSearchService.search(language, type, query);
			return ResponseEntity.ok(result);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	
	// 향수 이름 실시간 자동완성 (name, brand, rating 반환)
	@GetMapping("/perfume/autocomplete")
	public ResponseEntity<?> autocomplete(@RequestParam("q") String q) {
		try {
			List<AutocompleteDto> result = elasticSearchService.autocomplete(q);
			return ResponseEntity.ok(result);
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	// 세부 조건 필터 검색 (모든 파라미터 선택적)
	// accords, notes는 AND 조건 / language+textType+textQuery 세 개 모두 있으면 텍스트 검색도 동시 적용
	@PostMapping("/perfume/filter")
	public ResponseEntity<?> filterPerfume(@RequestBody PerfumeFilterRequest req) {
		try {
			List<PerfumeEsDocument> result = elasticSearchService.filter(req);

			if(result.isEmpty())
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No matches");

			return ResponseEntity.ok(result);

		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}


	// 향수 좋아요 / 취소 토글
	// userId는 JWT에서 파싱된 실제 userId 문자열
	@PostMapping("/perfume/{perfumeId}/like")
	public ResponseEntity<?> likePerfume(
			@PathVariable int perfumeId,
			Authentication authentication) {
		String userId = authentication.getName();

		try {
			boolean liked = service.likePerfume(userId, perfumeId);
			return ResponseEntity.ok(liked ? "liked" : "unliked");
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	// 당일 향수 좋아요 랭킹 조회 (Redis ZSet 기반)
	@GetMapping("/perfume/like/ranking")
	public ResponseEntity<?> getLikedPerfumeRanking() {
		try {
			List<PerfumeLikeRankingDto> ranking = service.likedPerfumeRanking();
			return ResponseEntity.ok(ranking);
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	/**
	 * 일별 perfume 랭킹을 DB에 Flush한다. (수동)
	 * 트렌디한 향수를 가져오기 위한 정보로 사용 가능.
	 * */



	/**
	 * 자동완성을 통해 나온 검색어를
	 * 사용자의 최근 검색어 키가 있는 Redis에 저장한다.
	 * */
	@GetMapping("/perfume/search/{perfumeId}")
	public ResponseEntity<?> searchPerfume(@PathVariable int perfumeId, Authentication auth){
		String userId = auth.getName();
		boolean result = service.searchPerfume(userId, perfumeId);

		if(result){
			return ResponseEntity.ok("Search History Saved");
		}else{
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Failed to save search history");
		}
	}

	@PostMapping("/perfume/addPerfume")
	public ResponseEntity<?> addPerfume(@PathVariable PerfumeBasicDto req, Authentication auth){
		String userId = auth.getName();





		return null;
	}





}










/*
 * @GetMapping("/perfume/selectNote/{perfumeId}") public ResponseEntity<?>
 * select(@PathVariable int perfumeId, HttpServletRequest request,
 * HttpServletResponse response) throws SQLException {
 * 
 * PerfumeWrapper detailedPerfumeInfo = service.getPerfumeWrapper(perfumeId);
 * List<MainAccordDto> mainAccordDtos = detailedPerfumeInfo.getMainAccord();
 * Map<String, List<String>> noteDtos = detailedPerfumeInfo.getNotes();
 * 
 * // detailed perfume Info에서 accords 추출 List<String> accords = new
 * ArrayList<>(); for(MainAccordDto ma: mainAccordDtos) {
 * accords.add(ma.getName()); } System.out.println(accords); // detailed perfume
 * Info에서 notes 추출 List<String> notes = new ArrayList<>(); String[] list = new
 * String[] {"top","middle","base"}; for(String s : list) {
 * List<String>noteNested = noteDtos.get(s); for(String nn: noteNested) {
 * notes.add(nn); } } System.out.println(notes); int unit = 5;
 * PerfumeResponseDto selectedNotes = service.selectPerfume(accords, notes,
 * unit);
 * 
 * // service.selectPerfume(); // var resp = service.selectPerfume( //
 * Optional.ofNullable(perfume.accords()).orElse(List.of()), // perfume.notes(),
 * // Optional.ofNullable(perfume.unit()).orElse(5) // ); // return
 * ResponseEntity.ok(selectedNotes); }
 */



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