package com.moodrop.model.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonUnwrapped;

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
public class PerfumeWrapperExtended extends PerfumeWrapper{
	
	@JsonIgnore
	private int matchId;
	private int matchCount;
	
	// DAO 결과 받는 용도로 쓴다.
	@JsonIgnore
	private String matchedNotesJson;
	
	// Json형식으로 된 전체 String을, TypeHandler를 이용해서 List<String> 형식으로 바꿔준다.
	private List<String> matchedNotes;
	
	public static PerfumeWrapperExtended of(PerfumeWrapper base,
	            int id,
	            int matchCount,
	            List<String> matchedNotes) {
		PerfumeWrapperExtended ext = new PerfumeWrapperExtended();
		// 부모(기본) 필드 복사
		ext.setPerfumeBasic(base.getPerfumeBasic());
		ext.setDayNightInfo(base.getDayNightInfo());
		ext.setLongevityInfo(base.getLongevityInfo());
		ext.setMainAccord(base.getMainAccord());
		ext.setNotes(base.getNotes());
		ext.setSeasonInfo(base.getSeasonInfo());
		ext.setSillageInfo(base.getSillageInfo());
		// 확장 필드
		ext.setMatchId(id);
		ext.setMatchCount(matchCount);
		ext.setMatchedNotes(matchedNotes);
		return ext;
	}
}

// 이미 상속 받았으니까, PerfumeWrapper 정보를 다시 받을 필요는 없다.
//	// Getter, Setter를 설정할 수 있게 perfumeWrapper를 변수로 설정해준다.
//	@JsonUnwrapped
//	private PerfumeWrapper base;