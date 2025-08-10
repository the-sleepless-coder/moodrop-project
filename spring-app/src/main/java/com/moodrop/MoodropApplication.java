package com.moodrop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.moodrop.model.repository")
public class MoodropApplication {

	public static void main(String[] args) {
		SpringApplication.run(MoodropApplication.class, args);
	}

}
