package com.moodrop;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

// 명시적으로 스캔 범위를 표시
@SpringBootApplication
@MapperScan(basePackages = "com.moodrop.model.dao")
@EnableJpaRepositories(basePackages = {"com.moodrop.repository", "com.moodrop.model.repository"})
@EnableElasticsearchRepositories(basePackages = "com.moodrop.elasticsearch")
@EnableScheduling
public class MoodropApplication {

	public static void main(String[] args) {
		SpringApplication.run(MoodropApplication.class, args);
	}
}