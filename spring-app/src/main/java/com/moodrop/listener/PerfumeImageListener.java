package com.moodrop.listener;

import com.moodrop.Enums.ImageType;
import com.moodrop.entity.PerfumeImage;
import com.moodrop.entity.Perfumes;
import com.moodrop.event.PerfumeCreatedEvent;
import com.moodrop.repository.PerfumeBasicRepository;
import com.moodrop.repository.PerfumeImageRepository;
import com.moodrop.service.S3UploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@Slf4j
@Component
@RequiredArgsConstructor
public class PerfumeImageListener {

    private final S3UploadService s3UploadService;
    private final PerfumeImageRepository perfumeImageRepository;
    private final PerfumeBasicRepository perfumeRepository;

    @Async("imageExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleImage(PerfumeCreatedEvent event) {
        long start = System.currentTimeMillis();
        try {
            Perfumes perfume = perfumeRepository.findById(event.getPerfumeId())
                    .orElseThrow(() -> new IllegalArgumentException("향수 없음: " + event.getPerfumeId()));

            // 1. 원본 이미지 S3에서 다운로드
            byte[] originalBytes = s3UploadService.downloadBytes(event.getS3Key());

            // 2. ORIGINAL width, height 추출 후 업데이트
            BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(originalBytes));
            PerfumeImage original = perfumeImageRepository
                    .findByPerfumeIdAndImageType(event.getPerfumeId(), ImageType.ORIGINAL)
                    .orElseThrow(() -> new IllegalArgumentException("ORIGINAL 이미지 없음: " + event.getPerfumeId()));
            original.setWidth(bufferedImage.getWidth());
            original.setHeight(bufferedImage.getHeight());
            perfumeImageRepository.save(original);

            // 3. Thumbnailator로 썸네일 생성 (300x300, 비율 유지)
            ByteArrayOutputStream thumbOut = new ByteArrayOutputStream();
            Thumbnails.of(new ByteArrayInputStream(originalBytes))
                    .size(300, 300)
                    .keepAspectRatio(true)
                    .outputFormat("jpg")
                    .toOutputStream(thumbOut);
            byte[] thumbBytes = thumbOut.toByteArray();

            // 3. 썸네일 S3 업로드
            String thumbKey = event.getS3Key().replace("perfume/image/", "perfume/image/thumb_");
            String thumbUrl = s3UploadService.uploadBytes(thumbBytes, thumbKey, "image/jpeg");

            // 4. perfume_image — THUMBNAIL 저장
            PerfumeImage thumbnail = new PerfumeImage();
            thumbnail.setPerfume(perfume);
            thumbnail.setImageType(ImageType.THUMBNAIL);
            thumbnail.setS3Key(thumbKey);
            thumbnail.setImageUrl(thumbUrl);
            thumbnail.setWidth(300);
            thumbnail.setHeight(300);
            perfumeImageRepository.save(thumbnail);

            // 5. image_status 완료 처리
            perfume.setImageStatus(true);
            perfumeRepository.save(perfume);

            log.info("perfumeId={} 썸네일 처리 완료 ({}ms)", event.getPerfumeId(), System.currentTimeMillis() - start);

        } catch (Exception e) {
            log.error("perfumeId={} 썸네일 처리 실패: {}", event.getPerfumeId(), e.getMessage(), e);
        }
    }
}
