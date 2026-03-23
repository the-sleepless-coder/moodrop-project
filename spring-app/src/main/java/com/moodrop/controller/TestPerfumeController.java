package com.moodrop.controller;

import com.moodrop.DTO.PerfumeBasicWithS3KeyDto;
import com.moodrop.entity.Perfumes;
import com.moodrop.service.TestPerfumeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * [테스트용] 단일 트랜잭션 vs 비동기 파이프라인 비교용 컨트롤러.
 *
 * 비교 방법:
 *   비동기: POST /api/perfume/addPerfume
 *   동기:   POST /api/test/perfume/addPerfume
 *
 * Grafana 11378에서 확인할 메트릭:
 *   - hikaricp_connections_usage_seconds (커넥션 점유 시간)
 *   - hikaricp_connections_active        (동시 점유 커넥션 수)
 *   - hikaricp_connections_pending       (대기 스레드 수)
 */
@Slf4j
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestPerfumeController {

    private final TestPerfumeService testPerfumeService;

    /**
     * 단일 트랜잭션: DB저장 → 번역 → ES 인덱싱 → Ollama 임베딩 → Qdrant
     * 전 과정 동안 DB 커넥션 점유 → usage_seconds 급증 확인용
     */
    @PostMapping("/perfume/addPerfume")
    public ResponseEntity<?> addPerfumeTest(@RequestBody PerfumeBasicWithS3KeyDto dto) {
        long start = System.currentTimeMillis();
        try {
            Perfumes perfume = testPerfumeService.savePerfumeSync(dto);
            log.info("[TestSync] 컨트롤러 응답 완료 ({}ms)", System.currentTimeMillis() - start);

            if (perfume.getId() > 0) {
                return ResponseEntity.ok("Perfume successfully added (sync, " + (System.currentTimeMillis() - start) + "ms)");
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to save the perfume");
            }
        } catch (Exception e) {
            log.error("[TestSync] 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }
}
