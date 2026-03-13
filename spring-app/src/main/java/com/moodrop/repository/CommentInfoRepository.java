package com.moodrop.repository;

import com.moodrop.entity.CommentInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentInfoRepository extends JpaRepository<CommentInfo, Integer> {
}
