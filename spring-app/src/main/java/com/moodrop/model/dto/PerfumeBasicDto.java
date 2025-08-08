package com.moodrop.model.dto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class PerfumeBasicDto{
	// Perfume 기본 정보
	// 모든 정보는 일단 column 명에 맞게 받고, 그 뒤에 getInfo로 묶어서 변경한다.
	// DB column <-> Java 객체 (snake_case <-> Camel Case 호환)
	private int id;
	private String perfumeName;
	private String brandName;
	private String country;
	private int year;
	private String gender;
	private String description;
	
	@JsonIgnore
	private int ratingVal;
	
	@JsonIgnore
	private int ratingCount;
	
	private List<String> comments;
	
	// 이거 DAO에서 조회한 정보 DTO에 어떻게 담을지 확인 
	// JSON key: value <-> 객체 (역직렬화, 직렬화) 과정에서 getter, setter 참고해서 형태 변환
	private Map<String, Integer> ratingInfo;
	public Map<String, Integer> getRatingInfo(){
		if(ratingInfo == null) {
			ratingInfo = new HashMap<>();
			ratingInfo.put("ratingVal", ratingVal);
			ratingInfo.put("ratingCount", ratingCount);
		}
		
		return ratingInfo;
	}
	
}
