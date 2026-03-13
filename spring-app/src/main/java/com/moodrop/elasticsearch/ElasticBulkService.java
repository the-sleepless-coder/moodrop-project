package com.moodrop.elasticsearch;

import com.moodrop.DTO.PerfumeDetailDto;
import com.moodrop.repository.PerfumeBasicRepository;
import com.moodrop.service.PerfumeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ElasticBulkService {

    private final PerfumeBasicRepository perfumeBasicRepository;
    private final PerfumeService perfumeService;
    private final PerfumeEsRepository perfumeEsRepository;

    // DB에 있는 모든 perfume_id를 elastic Search에 벌크로 넣는다.
    public int bulkIndex() {
        List<Integer> ids = perfumeBasicRepository.findAllWithDetails()
                .stream()
                .map(p -> p.getId())
                .collect(Collectors.toList());

        log.info("총 {}개 향수 ES 인덱싱 시작", ids.size());

        List<PerfumeEsDocument> docs = new ArrayList<>();
        int skipped = 0;

        for (Integer id : ids) {
            try {
                PerfumeDetailDto detail = perfumeService.getPerfumeDetail(id);
                docs.add(toDocument(detail));
            } catch (Exception e) {
                log.warn("perfume id={} 스킵: {}", id, e.getMessage());
                skipped++;
            }
        }

        perfumeEsRepository.saveAll(docs);
        log.info("ES 벌크 인덱싱 완료: {}개 성공, {}개 스킵", docs.size(), skipped);
        return docs.size();
    }

    // 특정 perfume_id 이후의 데이터만 elastic search에 벌크 단위로 넣는다.
    public int bulkIndexAfter(int fromId) {
        List<Integer> ids = perfumeBasicRepository.findAllWithDetailsAfter(fromId)
                .stream()
                .map(p -> p.getId())
                .collect(Collectors.toList());

        log.info("id > {} 향수 {}개 ES 인덱싱 시작", fromId, ids.size());

        List<PerfumeEsDocument> docs = new ArrayList<>();
        int skipped = 0;

        for (Integer id : ids) {
            try {
                PerfumeDetailDto detail = perfumeService.getPerfumeDetail(id);
                docs.add(toDocument(detail));
            } catch (Exception e) {
                log.warn("perfume id={} 스킵: {}", id, e.getMessage());
                skipped++;
            }
        }

        perfumeEsRepository.saveAll(docs);
        log.info("증분 ES 인덱싱 완료: {}개 성공, {}개 스킵", docs.size(), skipped);
        return docs.size();
    }

    private PerfumeEsDocument toDocument(PerfumeDetailDto dto) {
        PerfumeEsDocument doc = new PerfumeEsDocument();
        doc.setId(dto.getId());
        doc.setName(dto.getName());
        doc.setBrand(dto.getBrand());
        doc.setGender(dto.getGender() != null ? dto.getGender().name() : null);
        doc.setCountry(dto.getCountry());
        doc.setYear(dto.getYear());
        doc.setDescription(dto.getDescription());
        doc.setDescriptionKo(dto.getDescriptionKo());
        doc.setCommentsEng(dto.getCommentsEng());
        doc.setCommentsKo(dto.getCommentsKo());

        if (dto.getRating() != null) {
            doc.setRating(new PerfumeEsDocument.RatingDoc(
                    dto.getRating().getValue(),
                    dto.getRating().getCount()));
        }

        if (dto.getDayNight() != null) {
            doc.setDayNight(new PerfumeEsDocument.DayNightDoc(
                    dto.getDayNight().getDayNight(),
                    dto.getDayNight().getWeight()));
        }

        if (dto.getLongevity() != null) {
            doc.setLongevity(new PerfumeEsDocument.LongevityDoc(
                    dto.getLongevity().getLength(),
                    dto.getLongevity().getVoteNum()));
        }

        if (dto.getSillage() != null) {
            doc.setSillage(new PerfumeEsDocument.SillageDoc(
                    dto.getSillage().getStrength(),
                    dto.getSillage().getVoteNum()));
        }

        if (dto.getSeason() != null) {
            doc.setSeason(new PerfumeEsDocument.SeasonDoc(
                    dto.getSeason().getSeason(),
                    dto.getSeason().getWeight()));
        }

        if (dto.getNotes() != null) {
            doc.setNotes(dto.getNotes().stream()
                    .map(n -> new PerfumeEsDocument.NoteDoc(n.getName(), n.getType()))
                    .collect(Collectors.toList()));
        }

        if (dto.getAccords() != null) {
            doc.setAccords(dto.getAccords().stream()
                    .map(a -> new PerfumeEsDocument.AccordDoc(a.getName(), a.getWeight()))
                    .collect(Collectors.toList()));
        }

        return doc;
    }
}
