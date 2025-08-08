package com.moodrop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
	@Bean
	public BCryptPasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
	
	// Custom Security Filter Chain
	// Filter 단에서 인증 확인
	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception{
		// 테스트 위해서 전체 페이지에 대한 인증 제외
		http
		.csrf().disable()
		.authorizeHttpRequests(auth -> auth.anyRequest()
				.permitAll());
		
		/*
		.authorizeHttpRequests(authorizeHttpRequests -> authorizeHttpRequests
				.requestMatchers("/api/hithere").permitAll()
				.anyRequest().authenticated()
				);
		*/
	
		return http.build();
	}
	
	
}
