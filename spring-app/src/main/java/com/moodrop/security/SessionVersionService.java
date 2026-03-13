package com.moodrop.security;

import com.moodrop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SessionVersionService {

    private final UserRepository userRepository;

    // 로그인 시 호출 → version 증가 후 반환 (기존 발급된 토큰 전부 무효화)
    @Transactional
    public int incrementAndGet(String userId) {
        com.moodrop.entity.User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        return user.getTokenVersion();
    }

    // 필터에서 토큰 version 검증 시 호출
    public int getCurrentVersion(String userId) {
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId))
                .getTokenVersion();
    }
}
