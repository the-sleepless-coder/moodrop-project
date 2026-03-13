package com.moodrop.service;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.TimeUnit;

import com.moodrop.DTO.RecipeLikeRankingDto;
import com.moodrop.DTO.RecipeRankingDto;
import com.moodrop.entity.RecipeLike;
import com.moodrop.entity.RecipeLikeId;
import com.moodrop.entity.User;
import com.moodrop.entity.UserPerfumes;
import com.moodrop.repository.RecipeLikeRepository;
import com.moodrop.repository.UserPerfumesRepository;
import com.moodrop.repository.UserRepository;
import com.moodrop.utils.RedisRecipeKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moodrop.model.dao.RecipeDao;
import com.moodrop.model.dao.UserDao;
import com.moodrop.model.dto.UserRecipeDto;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecipeService {
	static int topRankingNum=50;
	private final RecipeDao dao;
	private final UserDao userDao;
	private final StringRedisTemplate redisTemplate;
	private final UserPerfumesRepository userPerfumesRepository;
	private final RecipeLikeRepository recipeLikeRepository;
	private final UserRepository userRepository;

	/*
     * userId를 이용해서 사용자의 모든 Recipe를 가져온다.
     * */
	public List<UserRecipeDto> getUserRecipe(String userId) {
		
		List<UserRecipeDto> userRecipeList = dao.selectUserRecipe(userId);
		
		return userRecipeList;
	}
	
	/*
	 * 사용자의 레시피를 작성한다.
	 * userRecipe 및 composition이 insert돼야 commit되게 한다.
	 * 그렇지 않으면 Rollback. 
	 * 추가 구현 사항: userId 포함, perfumeName 동일 시 rollBack 및 오류 메시지, rating_table 만들어서 평균 값 가져오기 
	 * */
	@Transactional
	public int createUserRecipe(UserRecipeDto userRecipe) {
		// 사용자 userId 받을 시(UserRecipeDto userRecipe, userId)
		// userRecipe.setUserId(userId)
		int resultStatus = dao.insertUserRecipe(userRecipe);
		int userPerfumeId = userRecipe.getRecipeId();
		if( userPerfumeId == 0) {
			throw new IllegalStateException("userPerfume을 가져오는 데 실패했습니다.");
		}
		
		if(userRecipe.getComposition() != null) {			
			dao.insertCompositionsInRecipe(userPerfumeId, userRecipe.getComposition());
		}
		
		return userPerfumeId;
	}
	
	// recipeId로 레시피를 조회한다.
	public UserRecipeDto selectUserRecipe(int recipeId) throws SQLException {
		/**
		 * recipeId 조회 안되는 문제 해결 필요.
		 * */
		UserRecipeDto recipe = dao.selectRecipeById(recipeId);
		if( recipe == null ) throw new SQLException("Recipe Not Found");
		System.out.println(recipe);
		
		return recipe;
	}
	
	// recipe를 수정한다.
	public int updateUserRecipe(UserRecipeDto userRecipe) {
		int updateRecipeResult = dao.updateUserRecipe(userRecipe);
		int recipeId = userRecipe.getRecipeId();
		
		int updateCompositionResult = dao.upsertCompositionsInRecipe(recipeId, userRecipe.getComposition());
		if(updateRecipeResult >0 && updateCompositionResult>0) {
			return 1;
		}
		
		return 0;
		
	}
	
	// recipeId로 레시피를 삭제한다.
	// 추가 구현 사항: userId 포함
	public int deleteUserRecipe(int recipeId) throws SQLException {
		
		int recipeDeleteResult = dao.deleteRecipeById(recipeId);
		
		if(recipeDeleteResult == 1 ) {
			return 1;
		}else {
			throw new SQLException();
		}
		
	}
	
	// 특정 사용자의 recipe를 나의 레시피로 복사한다.
	@Transactional
	public int copyRecipeIntoUser(int recipeId, String userIdString) throws SQLException {
		
		int userId = userDao.selectUserByString(userIdString);
		if(userId != 0) {
			// RecipeId로 recipe 넣기
			// userId를 로그인한 사람의 것으로 설정한다.
			UserRecipeDto recipe = dao.selectRecipeById(recipeId);
			recipe.setUserId(userId);
			// System.out.println(userId);
			
			int userRecipeResult = dao.insertUserRecipe(recipe);
			if (userRecipeResult == 0) throw new SQLException("Insert user_perfumes failed");
			// System.out.println(userRecipeResult);
			
			// Generated PK 사용.
			int newRecipeId = recipe.getRecipeId();
			
			// composition이 존재한다면, recipeId에 맞게 composition을 넣어준다.
			if(recipe.getComposition() != null) {			
				int compositionResult = dao.insertCompositionsInRecipe( newRecipeId, recipe.getComposition());
				if(compositionResult == 0 ) throw new SQLException("Insert compositions failed");
			}
			
			return 1;
		}else {
			return 0;
		}
		
	}
	
	/**
	 * 레시피에 대한 평점을 준다.
	 * **/
	public int insertRecipeRating(String userIdString, int recipeId, int rating) throws SQLException{
		
		// 평점에 대한 범위 설정
		if (rating < 1 || rating > 5) {
	        throw new IllegalArgumentException("rating은 1~5 사이여야 합니다.");
	    }
		
		// userId, recipeId, rating을 이용해서 평점 정보를 남긴다.
		int userId = userDao.selectUserByString(userIdString);
		
		int result = dao.insertRecipeRating(userId, recipeId, rating);
		if(result !=0) {
			// 별점 평균 연산 후 갱신
			double avg = dao.selectAverageRating(recipeId);
			dao.updateRecipeAverage(recipeId, avg);
			
			return result;
		}else {
			throw new SQLException();
		}	
	}
	
	
	/**
	 * 레시피에 대한 평점을 준다. (델타 방식 - 최적화 버전)
	 * 전체 평균 재계산 없이 델타 계산만으로 평균 업데이트
	 * INSERT + UPDATE 2개 쿼리만 실행 (SELECT 불필요)
	 * @Transactional로 원자성 보장
	 **/
	@Transactional
	public int insertRecipeRatingDelta(String userIdString, int recipeId, int rating) throws SQLException {

		// 평점 범위 검증
		if (rating < 1 || rating > 5) {
			throw new IllegalArgumentException("rating은 1~5 사이여야 합니다.");
		}

		// userId 조회
		int userId = userDao.selectUserByString(userIdString);

		// 델타 방식으로 INSERT + UPDATE 동시 실행
		int result = dao.insertRecipeRatingDelta(userId, recipeId, rating);

		if(result != 0) {
			return result;
		} else {
			throw new SQLException("별점 입력에 실패했습니다.");
		}
	}

	/**
	 * 레시피에 대해 이미 계산된 평점 평균을 가져온다.
	 * @throws SQLException
	 ***/
	public double getRecipeRating(int recipeId) throws SQLException {
		double result = dao.selectRecipeAverageFromDb(recipeId);

		if(result != 0) {
			return result;
		}else {
			throw new SQLException();
		}

	}


	// 쿨다운 정책을 적용해, 레시피의 조회수를 늘려준다.
	// 1분 이후에 눌러야 view를 할 수 있다.

	// DB에서 바로 조회 수를 업데이트 하는 방식이 아니라,
	// Redis에서 조회 수를 처리 하고 DB에 업데이트 하는 방식

	// 조회 수에 대한 동시성을 보장해줄 뿐만 아니라,
	// DB에서 락을 잡고 조회 수를 늘리는 것에 대한 병목을 없애준다.
	public boolean viewRecipe(String userId, int recipeId){
		// domain:feature:id 순으로 검색 용이하게 만듦.
		String coolDownKey = RedisRecipeKeys.recipeCoolDown(userId, recipeId);

		String countKey = RedisRecipeKeys.recipeCount(recipeId);
		String rankKey = RedisRecipeKeys.recipeDailyRank(LocalDate.now());
		String viewedSetKey = RedisRecipeKeys.RECIPE_VIEWED_SET;

		// 쿨다운 정책 적용
		Boolean isNew = redisTemplate.opsForValue()
				.setIfAbsent(coolDownKey, "1", 10, TimeUnit.SECONDS);

		// 쿨다운 확인 시,
		// Redis에서 조회수 늘리기 및 랭킹 적용.
		if(Boolean.TRUE.equals(isNew)){
			redisTemplate.opsForValue().increment(countKey);
			redisTemplate.expire(countKey, 15, TimeUnit.SECONDS);

			redisTemplate.opsForZSet().incrementScore(rankKey, String.valueOf(recipeId),1);
			redisTemplate.expire(rankKey, 2, TimeUnit.DAYS);

			redisTemplate.opsForSet().add(viewedSetKey, String.valueOf(recipeId));
			return true;
		}

		return false;
	}

	// 일별로 ZSET에 저장된 조회 수가 높은 순으로 높은 레시피 랭킹을 가져온다.
	public List<RecipeRankingDto> viewedRecipeRanking(){
		String rankingKey = RedisRecipeKeys.recipeDailyRank(LocalDate.now());

		Set<ZSetOperations.TypedTuple<String>> resultRedis =
				redisTemplate.opsForZSet().reverseRangeWithScores(rankingKey,0, topRankingNum);

		if(resultRedis ==null || resultRedis.isEmpty()){
			return Collections.emptyList();
		}

		List<RecipeRankingDto> result = new ArrayList<>();
		for(ZSetOperations.TypedTuple<String> tuple : resultRedis){
			Integer recipeId = Integer.parseInt(tuple.getValue());
			Optional<UserPerfumes> optional = userPerfumesRepository.findByIdWithUser(recipeId);

			// DB에 없는 키 값이 Redis에 있다면, Redis에서 지운다.
			if(optional.isEmpty()){
				log.warn("recipeId={} not found in DB. remove from redis rank.", recipeId);
				redisTemplate.opsForZSet().remove(rankingKey, String.valueOf(recipeId));
				continue;
			}

			String recipeName = optional.get().getName();
			Integer dailyViews = tuple.getScore().intValue();

			RecipeRankingDto dto = new RecipeRankingDto(recipeId, recipeName, dailyViews);

			result.add(dto);
		}

		return result;
	}

	/**
	 * 레시피 좋아요 / 취소 토글 (쿨다운 없음)
	 * @return true = 좋아요 등록, false = 좋아요 취소
	 */
	@Transactional
	public boolean likeRecipe(String userIdString, int recipeId) {
		User user = userRepository.findByUserId(userIdString)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

		RecipeLikeId likeId = new RecipeLikeId(user.getId(), recipeId);

		String dailyKey = RedisRecipeKeys.recipeLikeDailyRank(LocalDate.now());

		if (recipeLikeRepository.existsById(likeId)) {
			// 좋아요 취소 DB에 등록
			// 이미 좋아요 상태 → 취소
			recipeLikeRepository.deleteById(likeId);
			userPerfumesRepository.decrementLikeCount(recipeId);

			// 일별 랭킹 반영을 위한 Redis에 저장.
			redisTemplate.opsForZSet().incrementScore(dailyKey, String.valueOf(recipeId), -1);
			return false;
		} else {
			// 좋아요 DB에 등록
			UserPerfumes recipe = userPerfumesRepository.findById(recipeId)
					.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 레시피입니다."));
			recipeLikeRepository.save(new RecipeLike(likeId, user, recipe));
			userPerfumesRepository.incrementLikeCount(recipeId);

			// 일별 랭킹 반영을 위한 Redis에 저장.
			redisTemplate.opsForZSet().incrementScore(dailyKey, String.valueOf(recipeId), 1);
			return true;
		}
	}

	/**
	 * Redis ZSet 기반 좋아요 랭킹 조회 (상위 topRankingNum개)
	 */
	public List<RecipeLikeRankingDto> likedRecipeRanking() {
		String dailyKey = RedisRecipeKeys.recipeLikeDailyRank(LocalDate.now());

		Set<ZSetOperations.TypedTuple<String>> resultRedis =
				redisTemplate.opsForZSet().reverseRangeWithScores(dailyKey, 0, topRankingNum - 1);

		if (resultRedis == null || resultRedis.isEmpty()) {
			return Collections.emptyList();
		}

		List<RecipeLikeRankingDto> result = new ArrayList<>();
		for (ZSetOperations.TypedTuple<String> tuple : resultRedis) {
			Integer id = Integer.parseInt(tuple.getValue());
			UserPerfumes recipe = userPerfumesRepository.findByIdWithUser(id).orElseThrow();
			Integer likeCount = tuple.getScore().intValue();

			result.add(new RecipeLikeRankingDto(id, recipe.getName(), likeCount));
		}

		return result;
	}


}
