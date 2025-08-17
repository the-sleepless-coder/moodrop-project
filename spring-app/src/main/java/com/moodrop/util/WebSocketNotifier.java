package com.moodrop.util;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class WebSocketNotifier {
    private final SimpMessagingTemplate messaging;

    public void sendManufactureStatus(String deviceId, Long jobId, String status) {
        var payload = Map.of(
                "deviceId", deviceId,
                "jobId", jobId,
                "status", status
        );
        messaging.convertAndSend(
                "/api/manufacturing/jobs/" + jobId + "/status",
                payload
        );
    }
}
