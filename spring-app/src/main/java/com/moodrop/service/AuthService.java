package com.moodrop.service;

import com.moodrop.Enums.JwtTokenType;
import io.jsonwebtoken.Claims;
import com.moodrop.security.SessionVersionService;
import com.moodrop.security.jwt.JwtProperties;
import com.moodrop.security.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {
    static String ACCESS_TOKEN= "accessToken";
    static String REFRESH_TOKEN = "refreshToken";

    private final JwtProvider jwtProvider;
    private final JwtProperties jwtProperties;
    private final SessionVersionService sessionVersionService;
    private final StringRedisTemplate redisTemplate;

    public Map<String, String> createAccessAndRefreshToken(String userId){
        // 기기별 Session Id를 발급해서 로그인 세션 관리.
        String sid = UUID.randomUUID().toString();

        String accessToken = jwtProvider.generateAccessToken(userId, sid);

        // userId, sessionId를 활용한 refresh 토큰 생성 및 Hash 값 생성.
        String refreshToken = jwtProvider.generateRefreshToken(userId, sid);
        String refreshTokenHash = hashToken(refreshToken);

        // Refresh Token을 생성하고, 주어진 Redis Key에 String값으로 저장해준다.
        // rft:{userId}:{sid} = hash(refreshToken), TTL = refresh 만료시간
        String redisKey = "rft:" + userId + ":" + sid;
        redisTemplate.opsForValue().set(
                redisKey,
                refreshTokenHash,
                jwtProperties.getRefreshTokenExpiration(),
                TimeUnit.MILLISECONDS
        );

        Map<String, String> result = new HashMap<>();
        result.put(ACCESS_TOKEN, accessToken);
        result.put(REFRESH_TOKEN, refreshToken);

        return result;
    }

    // 만료된 access 토큰이어도 처리 가능하다.
    // access 토큰에서 sid 추출 → Redis의 해당 기기 refresh 토큰 삭제
    public void logout(String accessToken) {
        Claims claims = jwtProvider.getClaimsAllowExpired(accessToken);
        String userId = claims.getSubject();
        String sid = claims.get("sid", String.class);

        redisTemplate.delete("rft:" + userId + ":" + sid);
    }

    // 비밀번호 변경 시, version 증가를 통해서 기존에 발급된 토큰을 전부 무효화한다.
    public void changePassword(){
        // 로그인 성공 → version 증가 (기존에 발급된 토큰 전부 무효화)
        /**int version = sessionVersionService.incrementAndGet(request.getUserId());*/
    }

    // refreshToken이 유효한지 확인 후, Access Token 을 발급한다. 
    public String refreshAccessToken(String refreshToken) {
        // 1. JWT 서명/만료 검증
        if (!jwtProvider.isTokenValid(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }

        // 2. token_type == REFRESH 확인
        if (jwtProvider.getTokenType(refreshToken) != JwtTokenType.REFRESH) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not a refresh token");
        }

        // 3. userId, sid 추출
        String userId = jwtProvider.getUserName(refreshToken);
        String sid = jwtProvider.getSid(refreshToken);

        // 4. Redis에서 저장된 hash 조회
        String redisKey = "rft:" + userId + ":" + sid;
        String storedHash = redisTemplate.opsForValue().get(redisKey);

        // 5. Redis 키 없으면 → 만료되었거나 로그아웃된 토큰
        if (storedHash == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token not found");
        }

        // 6. hash 비교 → 다르면 탈취/변조된 토큰
        if (!storedHash.equals(hashToken(refreshToken))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token mismatch");
        }

        // 7. 같은 sid로 새 access 토큰 발급
        return jwtProvider.generateAccessToken(userId, sid);
    }


    // refresh 토큰을 SHA-256으로 해시
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }

}
