package com.moodrop.repository;

import com.moodrop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Integer> {

    // 사용자 userId로 찾는다.(이미지를 제외한 데이터를 가져온다.)
    Optional<User> findByUserId(String userId);

    // userId(문자열)로 PK(id)만 조회한다.
    @Query("""
            SELECT u.id 
            FROM User u 
            WHERE u.userId = :userIdStr
            """)
    Optional<Integer> findIdByUserIdStr(@Param("userIdStr") String userIdStr);

    // 이미지까지 가져온다.
    @Query("""
        SELECT u FROM User u
        LEFT JOIN fetch u.image
        WHERE u.id = :id
    """)
    Optional<User> findWithImageById(@Param("id") Integer id);



}