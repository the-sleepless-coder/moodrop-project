package com.moodrop.controller;

import com.moodrop.DTO.LoginRequestDto;
import com.moodrop.DTO.LoginResponseDto;
import com.moodrop.DTO.RefreshRequestDto;
import com.moodrop.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    static String ACCESS_TOKEN = "accessToken";
    static String REFRESH_TOKEN = "refreshToken";

    private final AuthenticationManager authenticationManager;
    private final AuthService service;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto request) {
        // DB 조회 + 비밀번호 검증 (CustomUserDetailsService 호출)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUserId(), request.getPassword())
        );

        // accessToken, RefreshToken을 생성하고,
        // Redis에 Hash화해서 저장한다.
        String userId = request.getUserId();
        Map<String, String> result = service.createAccessAndRefreshToken(userId);
        String accessToken = result.get(ACCESS_TOKEN);
        String refreshToken = result.get(REFRESH_TOKEN);

        return ResponseEntity.ok(new LoginResponseDto(accessToken, refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        // Authorization 헤더에서 access 토큰 추출 → sid 파싱 → Redis DEL
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().build();
        }

        service.logout(authHeader.substring(7));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@RequestBody RefreshRequestDto request) {
        // Redis에서 refresh Token 검증 후 유효하다면 → 새 access Token 발급
        // 검증 실패 시 AuthService에서 401 ResponseStatusException 발생
        String newAccessToken = service.refreshAccessToken(request.getRefreshToken());

        return ResponseEntity.ok(Map.of(ACCESS_TOKEN, newAccessToken));
    }
}
