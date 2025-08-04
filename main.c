// main.c
// 향수 제조 로봇 메인 제어 모듈

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include "MQTT.h"
#include "servo.h"
#include "log.h"
#include "LED.h"
#include "BaseStorage.h"

// 제조 상태 정의
typedef enum {
    MANUFACTURING_IDLE = 0,
    MANUFACTURING_READY,
    MANUFACTURING_RUNNING,
    MANUFACTURING_COMPLETE,
    MANUFACTURING_ERROR
} ManufacturingState;

// 전역 변수
static ManufacturingState current_state = MANUFACTURING_IDLE;
static Recipe current_recipe;
static int recipe_ready = 0;
static time_t manufacturing_start_time = 0;

// MQTT 메시지 콜백 함수
void on_mqtt_message(const char* topic, const char* payload) {
    printf("MQTT 메시지 수신: %s -> %s\n", topic, payload);
    
    // 레시피 메시지 처리
    if (strstr(topic, "recipe") != NULL) {
        if (parse_recipe(payload, &current_recipe) == 0) {
            recipe_ready = 1;
            current_state = MANUFACTURING_READY;
            log_write(LOG_MANUFACTURING, "새 레시피 수신 - %s", current_recipe.name);
        }
    }
    // 상태 요청 처리
    else if (strstr(topic, "status") != NULL) {
        char status_msg[512];
        get_system_status(status_msg);
        mqtt_send_signal("status/response", status_msg);
    }
    // 제조 시작 명령 처리
    else if (strstr(topic, "start") != NULL) {
        if (recipe_ready && current_state == MANUFACTURING_READY) {
            current_state = MANUFACTURING_RUNNING;
            log_write(LOG_MANUFACTURING, "제조 시작 명령 수신");
        }
    }
}

// 제조 프로세스 실행
int execute_manufacturing() {
    if (current_state != MANUFACTURING_RUNNING || !recipe_ready) {
        return -1;
    }
    
    // 제조 시작 시간 기록
    manufacturing_start_time = time(NULL);
    
    // LED 제조 시작 신호
    led_manufacturing_start();
    
    log_write(LOG_MANUFACTURING, "제조 시작 - 레시피: %s, 스텝 수: %d", 
              current_recipe.name, current_recipe.step_count);
    
    // 각 스텝 실행
    for (int i = 0; i < current_recipe.step_count; i++) {
        Step step = current_recipe.steps[i];
        
        // 제조 진행 상황 로그
        log_manufacturing_progress(current_recipe.name, i + 1, current_recipe.step_count, "실행 중");
        
        // 서보 동작 실행
        if (servo_execute_recipe_step(&step) != 0) {
            log_write(LOG_ERROR, "서보 동작 실패 - 스텝 %d", i + 1);
            current_state = MANUFACTURING_ERROR;
            led_error_signal();
            return -1;
        }
        
        // 스텝 간 대기
        usleep(500000);  // 0.5초 대기
    }
    
    // 제조 완료 처리
    current_state = MANUFACTURING_COMPLETE;
    recipe_ready = 0;
    
    // 제조 완료 시간 계산
    time_t manufacturing_end_time = time(NULL);
    int total_time_ms = (int)(manufacturing_end_time - manufacturing_start_time) * 1000;
    
    // 원료 용량 갱신
    if (update_materials_after_manufacturing(&current_recipe) != 0) {
        log_write(LOG_ERROR, "원료 용량 갱신 실패");
    }
    
    // LED 제조 완료 신호
    led_manufacturing_complete();
    
    // 제조 완료 로그
    log_manufacturing_complete(current_recipe.name, 1, total_time_ms, "정상 완료");
    
    // MQTT 완료 신호 전송
    mqtt_send_signal("manufacturing/complete", "success");
    
    return 0;
}

// 시스템 상태 모니터링
void monitor_system_status() {
    static time_t last_status_check = 0;
    time_t current_time = time(NULL);
    
    // 30초마다 상태 체크
    if (current_time - last_status_check >= 30) {
        // 서보 모터 상태 확인
        int valve_angle = servo_get_valve_angle();
        int plate_angle = servo_get_plate_angle();
        
        log_system_status("서보_밸브", "정상", "");
        log_system_status("서보_플레이트", "정상", "");
        
        // LED 상태 확인
        int led_state = led_get_state();
        log_system_status("LED", led_state ? "ON" : "OFF", "");
        
        // MQTT 연결 상태 확인
        int mqtt_connected = mqtt_is_connected();
        log_system_status("MQTT", mqtt_connected ? "연결됨" : "연결안됨", "");
        
        last_status_check = current_time;
    }
}

// 시스템 초기화
int system_init() {
    printf("향수 제조 로봇 시스템 초기화 중...\n");
    
    // 로그 시스템 초기화
    if (log_init() != 0) {
        printf("로그 시스템 초기화 실패\n");
        return -1;
    }
    
    // 베이스 스토리지 초기화
    if (basestorage_init() != 0) {
        printf("베이스 스토리지 초기화 실패\n");
        return -1;
    }
    
    // 서보 모터 초기화
    if (servo_init() != 0) {
        printf("서보 모터 초기화 실패\n");
        return -1;
    }
    
    // LED 초기화
    if (led_init() != 0) {
        printf("LED 초기화 실패\n");
        return -1;
    }
    
    // MQTT 초기화
    if (mqtt_init("localhost", 1883, "perfume_robot") != 0) {
        printf("MQTT 초기화 실패\n");
        return -1;
    }
    
    // MQTT 콜백 설정
    mqtt_set_callback(on_mqtt_message);
    
    // LED 준비 상태 표시
    led_show_pattern(LED_PATTERN_READY);
    
    printf("시스템 초기화 완료\n");
    log_write(LOG_MAINTENANCE, "시스템 초기화 완료");
    
    return 0;
}

// 시스템 정리
void system_cleanup() {
    printf("시스템 정리 중...\n");
    
    // LED 정리
    led_cleanup();
    
    // 서보 모터 정리
    servo_cleanup();
    
    // MQTT 연결 해제
    mqtt_disconnect();
    
    // 베이스 스토리지 정리
    basestorage_cleanup();
    
    // 로그 정리
    log_cleanup();
    
    printf("시스템 정리 완료\n");
}

// 메인 함수
int main() {
    printf("향수 제조 로봇 시작\n");
    
    // 시스템 초기화
    if (system_init() != 0) {
        printf("시스템 초기화 실패\n");
        return -1;
    }
    
    // 원료 현황 출력
    print_all_materials();
    
    printf("메인 루프 시작 (Ctrl+C로 종료)\n");
    
    // 메인 루프
    while (1) {
        // MQTT 이벤트 처리
        mqtt_loop();
        
        // LED 깜빡임 처리
        led_process_blink();
        
        // 제조 프로세스 실행
        if (current_state == MANUFACTURING_RUNNING) {
            if (execute_manufacturing() == 0) {
                // 제조 완료 후 대기 상태로 전환
                current_state = MANUFACTURING_IDLE;
                led_show_pattern(LED_PATTERN_SUCCESS);
                sleep(3);  // 3초간 성공 상태 표시
                led_show_pattern(LED_PATTERN_READY);
            }
        }
        
        // 시스템 상태 모니터링
        monitor_system_status();
        
        // CPU 부하 감소를 위한 대기
        usleep(100000);  // 0.1초 대기
    }
    
    // 시스템 정리 (실제로는 도달하지 않음)
    system_cleanup();
    
    return 0;
}
