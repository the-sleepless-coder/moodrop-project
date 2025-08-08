package com.moodrop.model.serviceImpl;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.moodrop.model.dao.PerfumeDao;
import com.moodrop.model.dto.CategoryMoodDto;
import com.moodrop.model.dto.DayNightDto;
import com.moodrop.model.dto.LongevityDto;
import com.moodrop.model.dto.MainAccordDto;
import com.moodrop.model.dto.NotesDto;
import com.moodrop.model.dto.PerfumeBasicDto;
import com.moodrop.model.dto.PerfumeExtendedDto;
import com.moodrop.model.dto.PerfumeMatchDto;
import com.moodrop.model.dto.PerfumeWrapper;
import com.moodrop.model.dto.SeasonDto;
import com.moodrop.model.dto.SillageDto;
import com.moodrop.model.service.PerfumeService;

@Service
public class PerfumeServiceImpl implements PerfumeService{
	@Autowired
	PerfumeDao dao;
	
	@Override
	public PerfumeWrapper getPerfumeWrapper(int id) throws SQLException {
		// perfumeId로 perfume 전체 정보 조회
		// 정보 없으면 SQL Exception을 띄운다.
		// DAO에서 DB의 정보를 갖고 오고, Service에서 조립한다.
		// 조립한 정보를 DTO를 이용해서 서로 다른 MVC Layer에서 정보를 주고 받는 데 쓴다.
		PerfumeBasicDto basic = dao.selectPerfumeBasicByPerfumeId(id);
		if(basic == null) throw new SQLException("Perfume Not Found");		
		List<String> comments = dao.selectCommentByPerfumeId(id);
		basic.setComments(comments);
		
		// dayNightInfo
		List<DayNightDto> dayNightList = dao.selectDayNightByPerfumeId(id);
		Map<String, Integer> dayNightInfo = new HashMap<>();
		for (DayNightDto dto : dayNightList) {
		    dayNightInfo.put(dto.getDayNight(), dto.getWeight());
		}

		// longevityInfo
		List<LongevityDto> longevityList = dao.selectLongevityByPerfumeId(id);
		Map<String, Integer> longevityInfo = new HashMap<>();
		for (LongevityDto dto : longevityList) {
		    longevityInfo.put(dto.getLength(), dto.getVoteNum());
		}

		// seasonInfo
		List<SeasonDto> seasonList = dao.selectSeasonByPerfumeId(id);
		Map<String, Integer> seasonInfo = new HashMap<>();
		for (SeasonDto dto : seasonList) {
		    seasonInfo.put(dto.getSeason(), dto.getWeight());
		}

		// sillageInfo
		List<SillageDto> sillageList = dao.selectSillageByPerfumeId(id);
		Map<String, Integer> sillageInfo = new HashMap<>();
		for (SillageDto dto : sillageList) {
		    sillageInfo.put(dto.getStrength(), dto.getVoteNum());
		}
		
		List<MainAccordDto> mainAccord = dao.selectMainAccordByPerfumeId(id);
		
		List<NotesDto> notes = dao.selectNotesByPerfumeId(id);
		
		PerfumeWrapper perfumeWrapper = new PerfumeWrapper(basic, dayNightInfo, longevityInfo, mainAccord, notes, seasonInfo, sillageInfo);
		
		return perfumeWrapper;
	}

	@Override
	public List<PerfumeExtendedDto> filterByAccord(List<String> accords) throws SQLException {
		// Accord로 걸러낸 향수에 대한 기본 정보를 가져온다.
		List<PerfumeMatchDto> filtered =  dao.searchByAccord(accords);
		
		List<PerfumeExtendedDto> result = new ArrayList<>();
		
			for(PerfumeMatchDto perfume : filtered) {
				int pfId = perfume.getPerfumeId();
				PerfumeBasicDto basicInfo = dao.selectPerfumeBasicByPerfumeId(pfId);
				PerfumeExtendedDto extendedInfo = new PerfumeExtendedDto();
				// 기존 정보 복사
				BeanUtils.copyProperties(basicInfo, extendedInfo);
					
				// 추가 정보 더함
				extendedInfo.setMatchCount(perfume.getMatchCount());
				
				List<SillageDto> sillageList = dao.selectSillageByPerfumeId(pfId);
		        Map<String, Integer> sillageMap = new HashMap<>();
		        for (SillageDto s : sillageList) {
		            sillageMap.put(s.getStrength(), s.getVoteNum());
		        }
		        extendedInfo.setSillage(sillageMap);

		        List<LongevityDto> longevityList = dao.selectLongevityByPerfumeId(pfId);
		        Map<String, Integer> longevityMap = new HashMap<>();
		        for (LongevityDto l : longevityList) {
		            longevityMap.put(l.getLength(), l.getVoteNum());
		        }
		        extendedInfo.setLongevity(longevityMap);
		        
				result.add(extendedInfo);
			}

		return result;
	}

	@Override
	public List<Map<Integer, String>> getCategory() throws SQLException {
	    return dao.selectCategoryInfo();
	}
	
	@Override
	public List<CategoryMoodDto> getCategoryMood() throws SQLException{
		return dao.selectCategoryMoodInfo();
	}

}
