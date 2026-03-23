package com.moodrop.security.jwt;

import com.moodrop.Enums.JwtTokenType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtProvider {
    private final JwtProperties jwtProperties;
    private final SecretKey key;

    /**
     * 토큰 생성
     * */
    // Base64형식으로 인코딩된 SecretKey를 디코딩된 형태로 쓴다.
    public JwtProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(String username, String sid) {
        return generateToken(username, sid, JwtTokenType.ACCESS, jwtProperties.getAccessTokenExpiration());
    }

    public String generateRefreshToken(String username, String sid) {
        return generateToken(username, sid, JwtTokenType.REFRESH, jwtProperties.getRefreshTokenExpiration());
    }

    // Head, Payload, Secret을 이용하여 Signature에 해당하는 JWT을 만들어준다.
    private String generateToken(String username, String sid, JwtTokenType type, long expiration) {
        // Access, RefreshToken의 만료 시간을 정해준다.
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(username)
                .claim("token_type", type.name())
                .claim("sid", sid)
                // .claim("ver", version)  // version 재활성화 시 추가
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /** JWT 검증 */
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // 필터에서 만료/위변조를 구분하기 위해 예외를 그대로 던진다.
    // ExpiredJwtException → 만료 (refresh 필요)
    // JwtException        → 서명 위변조 등 (재로그인 필요)
    public void validateToken(String token) {
        parseClaims(token);
    }

    /**정보 추출*/
    public String getUserName(String token) {
        return parseClaims(token).getSubject();
    }

    // 만료된 토큰이어도 Claims를 추출한다. (로그아웃 시 사용)
    // ExpiredJwtException은 만료됐어도 claims를 내부적으로 보유한다.
    public Claims getClaimsAllowExpired(String token) {
        try {
            return parseClaims(token);
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    public String getSid(String token) {
        return parseClaims(token).get("sid", String.class);
    }

    public int getVersion(String token) {
        return parseClaims(token).get("ver", Integer.class);
    }

    public JwtTokenType getTokenType(String token) {
        String type = parseClaims(token).get("token_type", String.class);
        return JwtTokenType.valueOf(type);
    }

    // Claim을 가져온다.
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
