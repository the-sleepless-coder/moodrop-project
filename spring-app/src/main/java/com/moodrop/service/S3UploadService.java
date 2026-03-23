package com.moodrop.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3UploadService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    static int URL_EXPIRATION_TIME=30;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    /**
     * perfume/image/{UUID}.{확장자} 경로로 S3에 업로드 후 30초짜리 presigned URL 반환
     */
    public String uploadPerfumeImagePresigned(MultipartFile file) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String s3Key = "perfume/image/" + UUID.randomUUID() + ext;

        // 업로드
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(s3Key)
                        .contentType(file.getContentType())
                        .contentLength(file.getSize())
                        .build(),
                RequestBody.fromBytes(file.getBytes())
        );

        // presigned GET URL (30초)
        return s3Presigner.presignGetObject(
                GetObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofSeconds(URL_EXPIRATION_TIME))
                        .getObjectRequest(
                                GetObjectRequest.builder()
                                        .bucket(bucket)
                                        .key(s3Key)
                                        .build())
                        .build()
        ).url().toString();
    }

    /**
     * perfume/image/{UUID}.{확장자} 경로로 S3에 업로드 후 30초짜리 presigned URL 반환
     */
    public String[] uploadPerfumeImage(MultipartFile file, String finalImageIdStr) throws IOException {

        String[] result = new String[2];

        String s3Key = "perfume/image/" + finalImageIdStr;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));

        String url = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + s3Key;

        result[0]= s3Key;
        result[1] = url;

        return result;

    }


    /** S3에서 bytes로 다운로드 */
    public byte[] downloadBytes(String s3Key) {
        ResponseBytes<GetObjectResponse> response = s3Client.getObjectAsBytes(
                GetObjectRequest.builder().bucket(bucket).key(s3Key).build()
        );
        return response.asByteArray();
    }

    /** bytes를 지정 s3Key로 업로드 후 URL 반환 */
    public String uploadBytes(byte[] bytes, String s3Key, String contentType) {
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(s3Key)
                        .contentType(contentType)
                        .contentLength((long) bytes.length)
                        .build(),
                RequestBody.fromBytes(bytes)
        );
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + s3Key;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return "." + filename.substring(filename.lastIndexOf('.') + 1);
    }
}
