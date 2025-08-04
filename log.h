// log.h
// 로그 기록 모듈 헤더 파일

#ifndef LOG_H
#define LOG_H

#include <stdarg.h>

// 로그 레벨 정의
typedef enum {
    LOG_ERROR = 0,
    LOG_MQTT,
    LOG_SERVO,
    LOG_MANUFACTURING,
    LOG_MAINTENANCE,
    LOG_LED
} LogLevel;

// 로그 초기화
int log_init();

// 로그 기록 (가변 인자)
void log_write(LogLevel level, const char* format, ...);

// MQTT 송수신 로그
void log_mqtt_transmission(const char* direction, const char* topic, const char* payload);

// 모터 동작 로그
void log_motor_movement(const char* motor_type, int angle, int duration_ms);

// 제조 진행 상황 로그
void log_manufacturing_progress(const char* recipe_name, int step, int total_steps, const char* status);

// 제조 완료 로그
void log_manufacturing_complete(const char* recipe_name, int success, int total_time_ms, const char* result);

// 원료 잔량 확인 로그
void log_material_check(const char* material_name, int current_amount, int required_amount, int available);

// 시스템 상태 로그
void log_system_status(const char* component, const char* status, const char* details);

// 에러 로그
void log_error(const char* component, const char* error_msg, int error_code);

// 제조 가능 여부 확인 로그
void log_manufacturing_possibility(const char* recipe_name, int possible, const char* reason);

// 원료 용량 업데이트 로그
void log_material_update(const char* material_name, int old_amount, int new_amount, const char* reason);

// LED 신호 로그
void log_led_signal(const char* signal_type, int value);

// 로그 파일 읽기 (최근 N줄)
int log_read_recent(char* buffer, int buffer_size, int lines);

// 로그 정리
void log_cleanup();

#endif // LOG_H 