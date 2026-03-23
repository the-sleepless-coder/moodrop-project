package com.moodrop.controller;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moodrop.DTO.*;
import com.moodrop.DTO.EsIdRangeDto;
import com.moodrop.entity.User;
import com.moodrop.service.*;
import com.moodrop.entity.Perfumes;
import com.moodrop.repository.PerfumeBasicRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.util.http.parser.Authorization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.moodrop.model.dto.CategoryMoodDto;
import com.moodrop.model.dto.MoodAccordDto;
import com.moodrop.model.dto.NotesDto;
import com.moodrop.model.dto.PerfumeWrapper;
import com.moodrop.model.dto.PerfumeWrapperExtended;
import com.moodrop.model.dto.UserNoteDto;
import com.moodrop.elasticsearch.AutocompleteDto;
import com.moodrop.elasticsearch.ElasticBulkService;
import com.moodrop.elasticsearch.ElasticSearchService;
import com.moodrop.elasticsearch.PerfumeEsDocument;
import com.moodrop.elasticsearch.PerfumeFilterRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PerfumeController {

	final PerfumeService service;
	final ElasticBulkService elasticBulkService;
	final ElasticSearchService elasticSearchService;
	final PerfumeImportService importService;
	final S3UploadService s3UploadService;
	final ImageBulkUploadService imageBulkUploadService;
	final VectorPipelineService vectorPipelineService;
	final NewVectorPipelineService newVectorPipelineService;
	final VectorSearchService vectorSearchService;
	final UserPersonalizationService userPersonalizationService;
	final OpenAiLlmService openAiLlmService;

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


	//-------------- 향수 추천 챗봇 ---------------------------
	// ES → Ollama 임베딩 → Qdrant 저장 파이프라인 실행 (비동기)
	// fromId, toId 생략 시 전체 실행
	@PostMapping("/elastic/vectorize")
	public ResponseEntity<?> vectorize(
			@RequestParam(required = false) Integer fromId,
			@RequestParam(required = false) Integer toId) {
		vectorPipelineService.runAsync(fromId, toId);
		return ResponseEntity.ok("Vector pipeline started (range: " + fromId + " ~ " + toId + ")");
	}

	// aggregate 방식 파이프라인 (description + comments 합산, 컬렉션: perfume_vectors_v2)
	@PostMapping("/elastic/vectorize/v2")
	public ResponseEntity<?> vectorizeV2(
			@RequestParam(required = false) Integer fromId,
			@RequestParam(required = false) Integer toId) {
		newVectorPipelineService.runAsync(fromId, toId);
		return ResponseEntity.ok("New vector pipeline started (range: " + fromId + " ~ " + toId + ")");
	}

	// ES에 인덱싱된 향수 id의 최솟값, 최댓값, 총 개수를 반환한다.
	@GetMapping("/elastic/idRange")
	public ResponseEntity<?> getEsIdRange() {
		try {
			EsIdRangeDto result = elasticSearchService.getIdRange();
			return ResponseEntity.ok(result);
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("ES 조회 실패: " + e.getMessage());
		}
	}

	// 의미 기반 향수 검색 (Qdrant 벡터 유사도)
	// lang: <en> | ko (생략 시 전체)
	// type: <description> | comment (생략 시 전체)
	// topK: 반환 개수 (기본 20)
	// Response: [{ id, score, payload: { perfume_id, source_type, lang, text } }]
	@GetMapping("/perfume/semanticSearch")
	public ResponseEntity<?> semanticSearch(
			@RequestParam String q,
			@RequestParam(defaultValue="en") String lang,
			@RequestParam(required=false) String type,
			@RequestParam(defaultValue = "20") int topK,
			Authentication auth) {
		try {
			String userId = auth.getName();
			VectorSearchResultDto result = vectorSearchService.temporaryTranslationSearch(q, lang, type, topK, userId);
			return ResponseEntity.ok(result);

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("벡터 검색 실패: " + e.getMessage());
		}
	}

	@GetMapping("/perfume/personalizedInfo")
	public ResponseEntity<?> userPersonalizedInfo(Authentication auth){
		try {
			String userIdStr = auth.getName();
			UserPersonalizationDto result = userPersonalizationService.fetch(userIdStr);

			return ResponseEntity.ok(result);
		}catch(Exception e){
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("유저 개인화된 정보 탐색 실패: " + e.getMessage());
		}
	}

	// Vector DB에서 검색 -> user 개인 정보 반영 -> 향수 5개 한줄 요약 및 추천 총평
	@GetMapping("/perfume/chatbot/recommend")
	public ResponseEntity<?> generateRecommendedPerfume(
			@RequestParam String q,
			@RequestParam(defaultValue="en") String lang,
			@RequestParam(required=false) String type,
			@RequestParam(defaultValue = "20") int topK,
			Authentication auth) {
		try {
			String userId = auth.getName();
			// VectorDB 검색 + user 개인 정보 반영
			VectorSearchResultDto recommendedPerfumes = vectorSearchService.temporaryTranslationSearch(q, lang, type, topK, userId);

			// 향수 5개 한줄 요약 및 추천 총평
			String result = openAiLlmService.generateRecommendation(q, recommendedPerfumes);
			
			return ResponseEntity.ok(result);

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("벡터 검색 실패: " + e.getMessage());
		}
	}



	//---------------- Elastic Search---------------------------
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

	@PostMapping(value="/perfume/addPerfumeObsolete", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> addPerfumeObsolete(@RequestPart("data") String data, @RequestPart("image") MultipartFile image) throws JsonProcessingException {

		long start = System.currentTimeMillis();
		ObjectMapper objectMapper = new ObjectMapper();

		PerfumeBasicDto dto = objectMapper.readValue(data, PerfumeBasicDto.class);

		Perfumes perfume = importService.savePerfumeObsolete(dto, image);

		int result = perfume.getId();

		// log.info("perfumeId={} [controller 응답] ({}ms)", result, System.currentTimeMillis() - start);

		if(result>0){
			return ResponseEntity.ok("Perfume successfully added");
		}else{
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to save the perfume");
		}

	}


	@PostMapping("/perfume/addPerfumeBulk")
	public ResponseEntity<?> addPerfumeBulk(@RequestBody List<PerfumeBasicWithS3KeyDto> dtoList) {
		int success = 0;
		for (PerfumeBasicWithS3KeyDto dto : dtoList) {
			try {
				Perfumes perfume = importService.savePerfume(dto);
				if (perfume.getId() > 0) success++;
			} catch (Exception e) {
				log.error("저장 실패: {}", dto.getName(), e);
			}
		}
		return ResponseEntity.ok("저장 완료: " + success + "/" + dtoList.size());
	}

	@PostMapping(value="/perfume/addPerfume")
	public ResponseEntity<?> addPerfume(@RequestBody PerfumeBasicWithS3KeyDto dto) {
		long start = System.currentTimeMillis();

		Perfumes perfume = importService.savePerfume(dto);

		int result = perfume.getId();

		// log.info("perfumeId={} [controller 응답] ({}ms)", result, System.currentTimeMillis() - start);

		if(result>0){
			return ResponseEntity.ok("Perfume successfully added");
		}else{
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to save the perfume");
		}

	}



	// AWS S3에 이미지 업로드.
	@PostMapping(value = "/perfume/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> uploadImage(@RequestPart("image") MultipartFile image) {
		try {
			String url = s3UploadService.uploadPerfumeImage(image, image.getOriginalFilename())[1];

			return ResponseEntity.ok(Map.of("url", url));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("이미지 업로드 실패: " + e.getMessage());
		}
	}

	// imageDir 디렉토리의 이미지 파일을 전부 S3에 업로드한다.
	// 파일명 규칙: {name}_{brand}_{year}.jpg  예) bleu_de_chanel_Chanel_2010.jpg
	@PostMapping("/perfume/image/bulkUpload")
	public ResponseEntity<?> bulkUploadImages() {
		try {
			List<String> uploadedKeys = imageBulkUploadService.uploadAll();
			return ResponseEntity.ok(Map.of(
					"count", uploadedKeys.size(),
					"keys", uploadedKeys
			));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("벌크 업로드 실패: " + e.getMessage());
		}
	}

	// OpenAI LLM 테스트 엔드포인트
	// GET /api/test/llm?q=프롬프트
	@GetMapping("/test/llm")
	public ResponseEntity<?> testLlm(@RequestParam String q) {
		try {
			FragranceQueryResult result = openAiLlmService.convertToFragranceQuery(q);
			return ResponseEntity.ok(result);
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("LLM 호출 실패: " + e.getMessage());
		}
	}


}

