package com.moodrop.model.dao;

import org.springframework.data.repository.query.Param;

public interface UserDao {
	// userString을 이용해서 userId를 추출한다.
	int selectUserByString(@Param("userIdString") String userString);
	
}
