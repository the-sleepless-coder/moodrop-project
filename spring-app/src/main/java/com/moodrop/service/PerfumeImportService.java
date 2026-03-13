package com.moodrop.service;

import com.moodrop.DTO.PerfumeBasicDto;
import com.moodrop.entity.*;
import com.moodrop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PerfumeImportService {

    private final BrandInfoRepository brandInfoRepo;
    private final CountryInfoRepository countryInfoRepo;
    private final RatingInfoRepository ratingInfoRepo;
    private final LongevityInfoRepository longevityInfoRepo;
    private final SillageInfoRepository sillageInfoRepo;
    private final CommentInfoRepository commentInfoRepo;
    private final PerfumeBasicRepository perfumeRepo;
    private final PerfumeSeasonRepository perfumeSeasonRepo;
    private final PerfumeDayNightRepository perfumeDayNightRepo;
    private final PerfumeLongevityRepository perfumeLongevityRepo;
    private final PerfumeSillageRepository perfumeSillageRepo;
    private final PerfumeCommentRepository perfumeCommentRepo;

    @Transactional
    public Perfumes savePerfume(PerfumeBasicDto dto) {

        // 1. 브랜드 - 이름이 같으면 재사용, 없으면 새로 생성
        BrandInfo brand = brandInfoRepo.findByName(dto.getBrandName())
                .orElseGet(() -> brandInfoRepo.save(new BrandInfo(null, dto.getBrandName())));

        // 2. 국가 - 동일하게 findOrCreate
        CountryInfo country = countryInfoRepo.findByCountry(dto.getCountry())
                .orElseGet(() -> countryInfoRepo.save(new CountryInfo(null, dto.getCountry())));

        // 3. rating_info - 향수마다 새로 생성 (공유 불가)
        RatingInfo rating = ratingInfoRepo.save(new RatingInfo(null, dto.getRatingVal(), dto.getRatingCount()));

        // 4. perfumes 저장 → DB가 id 생성
        Perfumes perfume = new Perfumes();
        perfume.setName(dto.getName());
        perfume.setBrand(brand);
        perfume.setCountry(country);
        perfume.setRating(rating);
        perfume.setDescription(dto.getDescription());
        perfume.setGender(dto.getGenderType());
        perfume.setYear(dto.getYear());

        Perfumes saved = perfumeRepo.save(perfume);

        // ★ 여기서 DB가 자동 생성한 perfume_id를 가져옴
        Integer perfumeId = saved.getId();

        // 5. perfume_season
        if (dto.getSeason() != null) {
            PerfumeSeason season = new PerfumeSeason(
                    perfumeId, dto.getSeason(), dto.getSeasonWeight(), null);
            perfumeSeasonRepo.save(season);
        }

        // 6. perfume_day_night
        if (dto.getPerfumeDayNight() != null) {
            PerfumeDayNight dayNight = new PerfumeDayNight(
                    perfumeId, dto.getPerfumeDayNight(), dto.getPerfumeDayNightWeight(), null);
            perfumeDayNightRepo.save(dayNight);
        }

        // 7. perfume_longevity - longevity_info 먼저 findOrCreate
        if (dto.getPerfumeLongevity() != null) {
            LongevityInfo longevity = longevityInfoRepo.findByLength(dto.getPerfumeLongevity())
                    .orElseGet(() -> longevityInfoRepo.save(new LongevityInfo(null, dto.getPerfumeLongevity())));

            PerfumeLongevity perfumeLongevity = new PerfumeLongevity(
                    perfumeId, longevity.getId(), dto.getPerfumeLongevityVotes(), null, null);

            perfumeLongevityRepo.save(perfumeLongevity);
        }

        // 8. perfume_sillage - sillage_info 먼저 findOrCreate
        if (dto.getPerfumeSillage() != null) {
            SillageInfo sillage = sillageInfoRepo.findByStrength(dto.getPerfumeSillage())
                    .orElseGet(() -> sillageInfoRepo.save(new SillageInfo(null, dto.getPerfumeSillage())));
            PerfumeSillage perfumeSillage = new PerfumeSillage(
                    perfumeId, sillage.getId(), dto.getPerfumeSillageVotes(), null, null);
            perfumeSillageRepo.save(perfumeSillage);
        }

        // 9. comments_info + perfume_comment 연결
        // commentsInfo에 먼저 넣고 id 생성
        // perfumeId가져와서 중간 테이블에 엔트리 생성.
        if (dto.getPerfumeComment() != null) {
            CommentInfo comment = commentInfoRepo.save(new CommentInfo(null, dto.getPerfumeComment(), null));

            PerfumeCommentId commentId = new PerfumeCommentId(perfumeId, comment.getId());

            PerfumeComment perfumeComment = new PerfumeComment(commentId, saved, comment);
            perfumeCommentRepo.save(perfumeComment);
        }

        return saved;
    }
}
