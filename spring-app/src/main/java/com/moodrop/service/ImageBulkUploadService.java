package com.moodrop.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageBulkUploadService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${image.dir}")
    private String imageDir;

    /**
     * imageDir 의 모든 이미지를 S3에 업로드한다.
     *
     * 파일명 규칙: {originalName}_{brand}_{year}.jpg
     *   예) bleu_de_chanel_Chanel_2010.jpg
     *
     * s3Key 생성 규칙 (savePerfume 과 동일):
     *   extractedImageIdStr = 파일명(공백→_)
     *   finalImageIdStr     = extractedImageIdStr + "_" + brand + "_" + year
     *   → 파일명이 이미 {name}_{brand}_{year}.jpg 형식이면 확장자만 제거하면 됨
     *
     * @return 업로드된 s3Key 목록
     */
    public List<String> uploadAll() throws IOException {
        Path dir = Paths.get(imageDir);

        if (!Files.exists(dir) || !Files.isDirectory(dir)) {
            throw new IllegalArgumentException("디렉토리가 존재하지 않습니다: " + imageDir);
        }

        List<String> uploadedKeys = new ArrayList<>();

        try (Stream<Path> files = Files.walk(dir, 1)) {
            files.filter(Files::isRegularFile)
                 .filter(this::isImageFile)
                 .forEach(file -> {
                     try {
                         String s3Key = buildS3Key(file);
                         upload(file, s3Key);
                         uploadedKeys.add(s3Key);
                         log.info("S3 업로드 완료: {}", s3Key);
                     } catch (IOException e) {
                         log.error("업로드 실패: {}", file.getFileName(), e);
                     }
                 });
        }

        log.info("총 {}개 업로드 완료", uploadedKeys.size());
        return uploadedKeys;
    }

    private void upload(Path file, String s3Key) throws IOException {
        String contentType = URLConnection.guessContentTypeFromName(file.getFileName().toString());
        byte[] bytes = Files.readAllBytes(file);

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(s3Key)
                        .contentType(contentType != null ? contentType : "application/octet-stream")
                        .contentLength((long) bytes.length)
                        .build(),
                RequestBody.fromBytes(bytes)
        );
    }

    /**
     * savePerfume 의 s3Key 생성 로직과 동일
     * 파일명에서 공백을 _로 치환 후 확장자를 제거해 s3Key 완성
     * bleu_de_chanel_Chanel_2010.jpg → perfume/image/bleu_de_chanel_Chanel_2010
     */
    private String buildS3Key(Path file) {
        String filename = file.getFileName().toString();
        // 공백 → _ 치환 (savePerfume 의 replaceAll("\\s+", "_") 과 동일)
        String extractedImageIdStr = filename.trim().replaceAll("\\s+", "_");
        // 확장자 제거 (브랜드·연도는 이미 파일명에 포함)
        int dotIdx = extractedImageIdStr.lastIndexOf('.');
        String finalImageIdStr = (dotIdx > 0) ? extractedImageIdStr.substring(0, dotIdx) : extractedImageIdStr;
        return "perfume/image/" + finalImageIdStr;
    }

    private boolean isImageFile(Path file) {
        String name = file.getFileName().toString().toLowerCase();
        return name.endsWith(".jpg") || name.endsWith(".jpeg")
                || name.endsWith(".png") || name.endsWith(".webp");
    }
}
