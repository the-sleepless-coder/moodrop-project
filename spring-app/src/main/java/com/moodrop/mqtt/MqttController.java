package com.moodrop.mqtt;

import com.moodrop.model.dto.DashboardStatsDto;
import com.moodrop.model.dto.RequestDto;
import com.moodrop.model.dto.ResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeoutException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Validated
public class MqttController {

    private final MqttService mqttService;

    @PutMapping("/devices/{deviceId}/ingredients/settings")
    public CompletableFuture<ResponseEntity<ResponseDto.UpdateResponseDto>> update(
            @PathVariable String deviceId,
            @RequestBody RequestDto.UpdateRequestDto dto
    ) {
        return mqttService.updateAsync(deviceId, dto)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
                    int code = (cause instanceof TimeoutException) ? 504 : 500;
                    return ResponseEntity.status(code).body(new ResponseDto.UpdateResponseDto(false, null));
                });
    }

    @PostMapping("/devices/{deviceId}/manufacturing/jobs")
    public CompletableFuture<ResponseEntity<ResponseDto.ManufactureResponseDto>> manufacture(
            @PathVariable String deviceId,
            @RequestBody RequestDto.ManufactureRequestDto dto
    ) {
        return mqttService.manufactureAsync(deviceId, dto)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
                    int code = (cause instanceof TimeoutException) ? 504 : 500;
                    return ResponseEntity.status(code).body(new ResponseDto.ManufactureResponseDto(false, null));
                });
    }

    @GetMapping("/devices/{deviceId}/ingredients")
    public CompletableFuture<ResponseEntity<ResponseDto.CheckResponseDto>> check(@PathVariable String deviceId) {
        return mqttService.checkAsync(deviceId)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
                    int code = (cause instanceof TimeoutException) ? 504 : 500;
                    return ResponseEntity.status(code).body(new ResponseDto.CheckResponseDto(false, null));
                });
    }

    @GetMapping("/devices/{deviceId}/status")
    public ResponseEntity<ResponseDto.StatusResponseDto> status(@PathVariable String deviceId) {
        return ResponseEntity.ok(mqttService.getDeviceStatus(deviceId));
    }

    @GetMapping("/devices/{deviceId}/connect")
    public ResponseEntity<CompletableFuture<ResponseDto.ConnectResponseDto>> connect(@PathVariable String deviceId) {
        return ResponseEntity.ok(mqttService.connectAsync(deviceId));
    }

    @GetMapping("/manufacturing/stats/{deviceId}")
    public ResponseEntity<DashboardStatsDto> stats(@PathVariable String deviceId) {
        return ResponseEntity.ok(mqttService.getStats(deviceId));
    }

    @GetMapping("/devices/{deviceId}/ingredients/check_sub")
    public java.util.concurrent.CompletableFuture<
            org.springframework.http.ResponseEntity<ResponseDto.CheckResponseDto>> checkSub(
            @PathVariable String deviceId) {
        var res = mqttService.checkFromDb(deviceId);
        return java.util.concurrent.CompletableFuture.completedFuture(
                org.springframework.http.ResponseEntity.ok(res));
    }

//    @PostMapping(path = "/devices/register", consumes = "application/json", produces = "application/json")
//    public void RegisterDevice(RequestDto.RegisterDeviceRequestDto dto) {
//        mqttService.registerDevice(dto);
//    }

}