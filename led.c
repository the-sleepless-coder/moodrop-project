// LED.c
// LED 제어 모듈 - 시각적 피드백 및 신호 전송

#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include "LED.h"
#include "log.h"

// LED 핀 정의
#define LED_PIN 23  // LED GPIO 핀

// LED 상태
static int led_initialized = 0;
static int led_current_state = 0;  // 0: OFF, 1: ON
static int led_blink_mode = 0;     // 0: 고정, 1: 깜빡임
static int led_blink_interval = 500; // 깜빡임 간격 (ms)

// LED 초기화
int led_init() {
    if (led_initialized) {
        return 0;
    }
    
    // GPIO 초기화 (실제 구현에서는 WiringPi 또는 다른 GPIO 라이브러리 사용)
    printf("LED 초기화 중...\n");
    
    // LED 초기 상태 설정 (OFF)
    led_current_state = 0;
    led_blink_mode = 0;
    
    led_initialized = 1;
    
    // 로그 기록
    log_write(LOG_LED, "LED 초기화 완료");
    
    return 0;
}

// LED 켜기
int led_on() {
    if (!led_initialized) {
        log_write(LOG_ERROR, "LED가 초기화되지 않음");
        return -1;
    }
    
    // 실제 GPIO 제어 (HIGH)
    printf("LED ON\n");
    
    led_current_state = 1;
    led_blink_mode = 0;  // 깜빡임 모드 해제
    
    // 로그 기록
    log_write(LOG_LED, "LED 켜짐");
    
    return 0;
}

// LED 끄기
int led_off() {
    if (!led_initialized) {
        log_write(LOG_ERROR, "LED가 초기화되지 않음");
        return -1;
    }
    
    // 실제 GPIO 제어 (LOW)
    printf("LED OFF\n");
    
    led_current_state = 0;
    led_blink_mode = 0;  // 깜빡임 모드 해제
    
    // 로그 기록
    log_write(LOG_LED, "LED 꺼짐");
    
    return 0;
}

// LED 토글
int led_toggle() {
    if (led_current_state) {
        return led_off();
    } else {
        return led_on();
    }
}

// LED 깜빡임 시작
int led_start_blink(int interval_ms) {
    if (!led_initialized) {
        log_write(LOG_ERROR, "LED가 초기화되지 않음");
        return -1;
    }
    
    led_blink_mode = 1;
    led_blink_interval = interval_ms;
    
    // 로그 기록
    log_write(LOG_LED, "LED 깜빡임 시작 - 간격: %dms", interval_ms);
    
    return 0;
}

// LED 깜빡임 정지
int led_stop_blink() {
    if (!led_initialized) {
        return -1;
    }
    
    led_blink_mode = 0;
    
    // 로그 기록
    log_write(LOG_LED, "LED 깜빡임 정지");
    
    return 0;
}

// LED 깜빡임 처리 (메인 루프에서 호출)
void led_process_blink() {
    if (!led_initialized || !led_blink_mode) {
        return;
    }
    
    static unsigned long last_toggle = 0;
    unsigned long current_time = (unsigned long)(time(NULL) * 1000);
    
    if (current_time - last_toggle >= led_blink_interval) {
        led_toggle();
        last_toggle = current_time;
    }
}

// 신호 전송 (서보 모터로부터 받은 신호를 로그에 전달)
void led_send_signal(const char* signal_type, int value) {
    if (!led_initialized) {
        return;
    }
    
    // 신호 타입에 따른 LED 동작
    if (strcmp(signal_type, "valve_movement") == 0) {
        // 밸브 동작 시 짧은 깜빡임
        led_start_blink(100);
        usleep(500000);  // 0.5초 대기
        led_stop_blink();
        led_on();
        
    } else if (strcmp(signal_type, "plate_movement") == 0) {
        // 플레이트 동작 시 긴 깜빡임
        led_start_blink(300);
        usleep(1000000);  // 1초 대기
        led_stop_blink();
        led_off();
        
    } else if (strcmp(signal_type, "manufacturing_start") == 0) {
        // 제조 시작 시 연속 깜빡임
        led_start_blink(200);
        
    } else if (strcmp(signal_type, "manufacturing_complete") == 0) {
        // 제조 완료 시 고정 ON
        led_stop_blink();
        led_on();
        
    } else if (strcmp(signal_type, "error") == 0) {
        // 에러 시 빠른 깜빡임
        led_start_blink(50);
    }
    
    // 로그에 신호 기록
    log_led_signal(signal_type, value);
}

// 제조 완료 신호
void led_manufacturing_complete() {
    led_send_signal("manufacturing_complete", 1);
}

// 에러 신호
void led_error_signal() {
    led_send_signal("error", 1);
}

// 제조 시작 신호
void led_manufacturing_start() {
    led_send_signal("manufacturing_start", 1);
}

// 현재 LED 상태 반환
int led_get_state() {
    return led_current_state;
}

// 깜빡임 모드 상태 반환
int led_get_blink_mode() {
    return led_blink_mode;
}

// LED 패턴 표시 (상태 표시용)
void led_show_pattern(LEDPattern pattern) {
    if (!led_initialized) {
        return;
    }
    
    switch (pattern) {
        case LED_PATTERN_READY:
            // 준비 상태: 천천히 깜빡임
            led_start_blink(1000);
            break;
            
        case LED_PATTERN_WORKING:
            // 작업 중: 중간 속도 깜빡임
            led_start_blink(500);
            break;
            
        case LED_PATTERN_SUCCESS:
            // 성공: 고정 ON
            led_stop_blink();
            led_on();
            break;
            
        case LED_PATTERN_ERROR:
            // 에러: 빠른 깜빡임
            led_start_blink(100);
            break;
            
        case LED_PATTERN_WARNING:
            // 경고: 느린 깜빡임
            led_start_blink(2000);
            break;
            
        default:
            led_off();
            break;
    }
    
    log_write(LOG_LED, "LED 패턴 표시 - 패턴: %d", pattern);
}

// LED 정리
void led_cleanup() {
    if (!led_initialized) {
        return;
    }
    
    led_off();
    led_stop_blink();
    
    // GPIO 정리
    printf("LED 정리 완료\n");
    
    log_write(LOG_LED, "LED 정리 완료");
    
    led_initialized = 0;
}
