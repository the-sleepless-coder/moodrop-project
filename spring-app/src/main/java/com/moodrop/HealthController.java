package com.moodrop;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

//@Sl4j
@RequestMapping("/health")
@RestController
public class HealthController {

    @GetMapping
    public ResponseEntity<?> healthCheck() {
        long startTime = System.currentTimeMillis();

        // 현재 상태와 시작 시간을 넣어준다.
        Map<String, String> response = new HashMap<>();
        response.put("status", "up");
        response.put("timestamp", LocalDateTime.now().toString());

        // 진행 시간을 응답에 넣어준다.
        long processingTime = System.currentTimeMillis() - startTime;
        response.put("serverProcessingTime", processingTime + "ms");

        return ResponseEntity.ok(response);
    }


}
