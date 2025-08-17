package com.moodrop;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan(basePackages = "com.moodrop.model.dao")
public class MoodropApplication {

	public static void main(String[] args) {
		SpringApplication.run(MoodropApplication.class, args);
	}
}