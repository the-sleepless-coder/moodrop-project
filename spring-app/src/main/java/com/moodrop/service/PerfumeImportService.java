package com.moodrop.service;

import com.moodrop.DTO.PerfumeBasicDto;
import com.moodrop.DTO.PerfumeBasicWithS3KeyDto;
import com.moodrop.Enums.ImageType;
import com.moodrop.entity.*;
import com.moodrop.event.PerfumeCreatedEvent;
import com.moodrop.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import javax.imageio.ImageIO;
import java.util.Optional;

@Slf4j
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
    private final PerfumeImageRepository perfumeImageRepo;
    private final ApplicationEventPublisher eventPublisher;
    private final S3UploadService s3UploadService;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    @Transactional
    public Perfumes savePerfumeObsolete(PerfumeBasicDto dto, MultipartFile image) {
        long start = System.currentTimeMillis();
        Optional<Perfumes> perfumeSearch = perfumeRepo.findByName(dto.getName());
        if (perfumeSearch.isPresent()) {
            return perfumeSearch.get();
        }

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
        if (dto.getPerfumeComment() != null && !dto.getPerfumeComment().isEmpty()) {
            for (String commentText : dto.getPerfumeComment()) {
                CommentInfo comment = commentInfoRepo.save(new CommentInfo(null, commentText, null));
                PerfumeCommentId commentId = new PerfumeCommentId(perfumeId, comment.getId());
                perfumeCommentRepo.save(new PerfumeComment(commentId, saved, comment));
            }
        }

        log.info("perfumeId={} [savePerfume만 완료] ({}ms)", saved.getId(), System.currentTimeMillis() - start);

        // Multipart로 받은 이미지를 S3에 업로드한다.
        String url = null;
        String extractedImageIdStr = dto.getName().trim().replaceAll("\\s+", "_");
        String finalImageIdStr = extractedImageIdStr + "_" + perfume.getBrand().getName() + "_" + perfume.getYear();
        String s3Key = null;
        try {
            String[] result = s3UploadService.uploadPerfumeImage(image, finalImageIdStr);
            s3Key = result[0];
            url = result[1];

            BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(image.getBytes()));
            int width = bufferedImage.getWidth();
            int height = bufferedImage.getHeight();

            PerfumeImage original = new PerfumeImage();
            original.setPerfume(saved);
            original.setImageType(ImageType.ORIGINAL);
            original.setS3Key(s3Key);
            original.setImageUrl(url);
            original.setWidth(width);
            original.setHeight(height);
            perfumeImageRepo.save(original);

        } catch (Exception e) {
            e.printStackTrace();
        }

        log.info("perfumeId={} [savePerfume + S3업로드 완료] ({}ms)", saved.getId(), System.currentTimeMillis() - start);

        // 이벤트를 형성하여,
        // 별도 스레드로 비동기적 처리를 통해 트랜잭션 관리.
        eventPublisher.publishEvent(
            new PerfumeCreatedEvent(perfume.getId(), url, s3Key, dto.getDescription(), dto.getPerfumeComment())
        );

        return saved;
    }


    @Transactional
    public Perfumes savePerfume(PerfumeBasicWithS3KeyDto dto) {
        long start = System.currentTimeMillis();
        Optional<Perfumes> perfumeSearch = perfumeRepo.findByName(dto.getName());
        if (perfumeSearch.isPresent()) {
            return perfumeSearch.get();
        }

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
        if (dto.getPerfumeComment() != null && !dto.getPerfumeComment().isEmpty()) {
            for (String commentText : dto.getPerfumeComment()) {
                CommentInfo comment = commentInfoRepo.save(new CommentInfo(null, commentText, null));
                PerfumeCommentId commentId = new PerfumeCommentId(perfumeId, comment.getId());
                perfumeCommentRepo.save(new PerfumeComment(commentId, saved, comment));
            }
        }

        log.info("perfumeId={} [savePerfume만 완료] ({}ms)", saved.getId(), System.currentTimeMillis() - start);

        String s3Key = dto.getS3Key();
        String url = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + s3Key;

        PerfumeImage original = new PerfumeImage();
        original.setPerfume(saved);
        original.setImageType(ImageType.ORIGINAL);
        original.setS3Key(s3Key);
        original.setImageUrl(url);
        perfumeImageRepo.save(original);

        // 이벤트를 형성하여,
        // 별도 스레드로 비동기적 처리를 통해 트랜잭션 관리.
        eventPublisher.publishEvent(
                new PerfumeCreatedEvent(perfume.getId(), url, s3Key, dto.getDescription(), dto.getPerfumeComment())
        );

        return saved;
    }
}
