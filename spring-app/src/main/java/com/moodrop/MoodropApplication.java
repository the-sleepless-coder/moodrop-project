package com.moodrop;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan(basePackages = "com.moodrop.model.dao")
@EnableJpaRepositories(basePackages = "com.moodrop.model.repository")
public class MoodropApplication {

	public static void main(String[] args) {
		SpringApplication.run(MoodropApplication.class, args);
	}
}