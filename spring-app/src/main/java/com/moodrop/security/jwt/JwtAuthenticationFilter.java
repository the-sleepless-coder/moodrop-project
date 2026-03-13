package com.moodrop.security.jwt;

import com.moodrop.security.CustomUserDetailsService;
import com.moodrop.security.SessionVersionService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final CustomUserDetailsService userDetailsService;
    private final SessionVersionService sessionVersionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        // Authorization 헤더 없으면 → 인증 없이 통과 (public 엔드포인트 or Security가 막음)
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        // 토큰 유효성 검증 - 만료/위변조를 구분해서 401 반환
        try {
            jwtProvider.validateToken(token);
        } catch (ExpiredJwtException e) {
            // access 토큰 만료 → 클라이언트가 /refresh를 호출해야 함
            sendUnauthorized(response, "TOKEN_EXPIRED");
            return;
        } catch (JwtException | IllegalArgumentException e) {
            // 서명 위변조 등 → 재로그인 필요
            sendUnauthorized(response, "INVALID_TOKEN");
            return;
        }

        String username = jwtProvider.getUserName(token);

        // JWT에 대한 인증이 완료 됐으면, Spring Security에 해당 요청이 인증됐다고 등록해야 한다.
        // SecurityContext에 인증 정보가 없을 때만 설정
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 토큰의 version이 DB의 현재 version과 다르면 → 이미 만료된 토큰 (강제 로그아웃 등)
            /**int tokenVersion = jwtProvider.getVersion(token);
            int currentVersion = sessionVersionService.getCurrentVersion(username);
            if (tokenVersion != currentVersion) {
                sendUnauthorized(response, "TOKEN_EXPIRED");
                return;
            }
            */

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        chain.doFilter(request, response);
    }

    // 필터에서 직접 401 응답 작성
    private void sendUnauthorized(HttpServletResponse response, String errorCode) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\": \"" + errorCode + "\"}");
    }
}
