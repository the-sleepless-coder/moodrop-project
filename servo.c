// servo.c
// 서보 모터 제어 모듈 - 밸브 및 플레이트 회전 제어

#include <stdio.h>
#include <unistd.h>
#include "servo.h"
#include "log.h"
#include "LED.h"

// 서보 모터 핀 정의
#define SERVO_VALVE_PIN    18  // 밸브 서보 핀
#define SERVO_PLATE_PIN    19  // 플레이트 회전 서보 핀

// 서보 모터 상태
static int servo_valve_angle = 0;    // 밸브 현재 각도
static int servo_plate_angle = 0;    // 플레이트 현재 각도
static int servo_initialized = 0;    // 초기화 상태

// 서보 모터 초기화
int servo_init() {
    if (servo_initialized) {
        return 0;
    }
    
    // GPIO 초기화 (실제 구현에서는 WiringPi 또는 다른 GPIO 라이브러리 사용)
    printf("서보 모터 초기화 중...\n");
    
    // 초기 위치로 설정
    servo_set_valve_angle(0);    // 밸브 닫힘
    servo_set_plate_angle(0);    // 플레이트 초기 위치
    
    servo_initialized = 1;
    
    // 로그 기록
    log_write(LOG_SERVO, "서보 모터 초기화 완료");
    
    return 0;
}

// 밸브 서보 각도 설정
int servo_set_valve_angle(int angle) {
    if (!servo_initialized) {
        log_write(LOG_ERROR, "서보 모터가 초기화되지 않음");
        return -1;
    }
    
    // 각도 범위 제한 (0-180도)
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;
    
    // 실제 서보 제어 (PWM 신호 생성)
    // 실제 구현에서는 PWM 라이브러리 사용
    printf("밸브 서보 각도 설정: %d도\n", angle);
    
    servo_valve_angle = angle;
    
    // 모터 동작 로그 기록
    log_write(LOG_SERVO, "밸브 서보 동작 - 각도: %d도", angle);
    
    // LED 신호 전송
    led_send_signal("valve_movement", angle);
    
    return 0;
}

// 플레이트 서보 각도 설정
int servo_set_plate_angle(int angle) {
    if (!servo_initialized) {
        log_write(LOG_ERROR, "서보 모터가 초기화되지 않음");
        return -1;
    }
    
    // 각도 범위 제한 (0-360도)
    if (angle < 0) angle = 0;
    if (angle > 360) angle = 360;
    
    // 실제 서보 제어 (PWM 신호 생성)
    printf("플레이트 서보 각도 설정: %d도\n", angle);
    
    servo_plate_angle = angle;
    
    // 모터 동작 로그 기록
    log_write(LOG_SERVO, "플레이트 서보 동작 - 각도: %d도", angle);
    
    // LED 신호 전송
    led_send_signal("plate_movement", angle);
    
    return 0;
}

// 밸브 열기
int servo_open_valve() {
    return servo_set_valve_angle(90);  // 90도로 밸브 열기
}

// 밸브 닫기
int servo_close_valve() {
    return servo_set_valve_angle(0);   // 0도로 밸브 닫기
}

// 플레이트를 특정 위치로 회전
int servo_rotate_plate_to_position(int position) {
    // 위치를 각도로 변환 (예: 12개 위치, 각각 30도씩)
    int angle = position * 30;
    return servo_set_plate_angle(angle);
}

// 현재 밸브 각도 반환
int servo_get_valve_angle() {
    return servo_valve_angle;
}

// 현재 플레이트 각도 반환
int servo_get_plate_angle() {
    return servo_plate_angle;
}

// 서보 모터 정지
void servo_stop() {
    if (!servo_initialized) {
        return;
    }
    
    // 서보 모터 정지 (PWM 신호 중단)
    printf("서보 모터 정지\n");
    
    log_write(LOG_SERVO, "서보 모터 정지");
}

// 서보 모터 정리
void servo_cleanup() {
    if (!servo_initialized) {
        return;
    }
    
    // 안전한 위치로 이동
    servo_close_valve();
    servo_set_plate_angle(0);
    
    // GPIO 정리
    printf("서보 모터 정리 완료\n");
    
    log_write(LOG_SERVO, "서보 모터 정리 완료");
    
    servo_initialized = 0;
}

// 레시피에 따른 서보 동작 실행
int servo_execute_recipe_step(const Step* step) {
    if (!servo_initialized) {
        log_write(LOG_ERROR, "서보 모터가 초기화되지 않음");
        return -1;
    }
    
    // 1. 플레이트를 목표 위치로 회전
    if (servo_rotate_plate_to_position(step->position) != 0) {
        log_write(LOG_ERROR, "플레이트 회전 실패");
        return -1;
    }
    
    // 회전 완료 대기
    usleep(1000000);  // 1초 대기
    
    // 2. 밸브 열기
    if (servo_open_valve() != 0) {
        log_write(LOG_ERROR, "밸브 열기 실패");
        return -1;
    }
    
    // 분사 시간만큼 대기
    usleep(step->dispense_time_ms * 1000);
    
    // 3. 밸브 닫기
    if (servo_close_valve() != 0) {
        log_write(LOG_ERROR, "밸브 닫기 실패");
        return -1;
    }
    
    log_write(LOG_SERVO, "레시피 스텝 실행 완료 - 위치: %d, 분사시간: %dms", 
              step->position, step->dispense_time_ms);
    
    return 0;
}
