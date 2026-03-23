package com.moodrop.repository;

import com.moodrop.entity.Perfumes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PerfumeBasicRepository extends JpaRepository<Perfumes, Integer> {

    // ID로 단건 조회 (brand, country, rating 한번에 FETCH JOIN → N+1 방지)
    // Persistence Context에 올라온 정보를 가져와서, 
    // perfume_id에 해당하는 것을 다른 column 정보를 포함해서 저장한다.
    @Query("SELECT p FROM Perfumes p " +
           "JOIN FETCH p.brand " +
           "JOIN FETCH p.country " +
           "JOIN FETCH p.rating " +
           "WHERE p.id = :id")
    Optional<Perfumes> findByIdWithBasics(@Param("id") Integer id);

    // 전체 목록 조회 (FETCH JOIN)
    @Query("SELECT p FROM Perfumes p " +
           "JOIN FETCH p.brand " +
           "JOIN FETCH p.country " +
           "JOIN FETCH p.rating")
    List<Perfumes> findAllWithDetails();

    // 이름으로 검색 (부분 일치, 대소문자 무시)
    @Query("SELECT p FROM Perfumes p " +
           "JOIN FETCH p.brand " +
           "JOIN FETCH p.country " +
           "JOIN FETCH p.rating " +
           "WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Perfumes> findByNameContaining(@Param("name") String name);

    // 브랜드 ID로 조회
    @Query("SELECT p FROM Perfumes p " +
           "JOIN FETCH p.brand b " +
           "JOIN FETCH p.country " +
           "JOIN FETCH p.rating " +
           "WHERE b.id = :brandId")
    List<Perfumes> findByBrandId(@Param("brandId") Integer brandId);

    // 출시 연도로 조회
    @Query("SELECT p FROM Perfumes p " +
           "JOIN FETCH p.brand " +
           "JOIN FETCH p.country " +
           "JOIN FETCH p.rating " +
           "WHERE p.year = :year")
    List<Perfumes> findByYear(@Param("year") Integer year);
   
    // fromId 초과 향수 목록 조회 (증분 인덱싱용)
    @Query("SELECT p FROM Perfumes p " +
           "JOIN FETCH p.brand " +
           "JOIN FETCH p.country " +
           "JOIN FETCH p.rating " +
           "WHERE p.id > :fromId ORDER BY p.id ASC")
    List<Perfumes> findAllWithDetailsAfter(@Param("fromId") Integer fromId);

    // 향수 이름으로 id 조회 (정확히 일치)
    @Query("""
    SELECT p.id
    FROM Perfumes p
    WHERE LOWER(p.name)=LOWER(:name)
    """)
    Optional<Integer> findIdByName(@Param("name") String name);

    // 좋아요 수 1 증가
    @Modifying
    @Transactional
    @Query("UPDATE Perfumes p SET p.likeCount = p.likeCount + 1 WHERE p.id = :perfumeId")
    int incrementLikeCount(@Param("perfumeId") Integer perfumeId);

    // 좋아요 수 1 감소 (0 미만 방지)
    @Modifying
    @Transactional
    @Query("UPDATE Perfumes p SET p.likeCount = p.likeCount - 1 WHERE p.id = :perfumeId AND p.likeCount > 0")
    int decrementLikeCount(@Param("perfumeId") Integer perfumeId);


    Optional<Perfumes> findByName(String name);

}
