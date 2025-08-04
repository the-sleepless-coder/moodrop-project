// log.c
// 로그 기록 모듈 - 시스템 동작 기록 및 관리

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include "log.h"

// 로그 파일 경로
#define LOG_FILE_PATH "/var/log/perfume_robot.log"
#define LOG_MAX_SIZE (10 * 1024 * 1024)  // 10MB

// 로그 레벨 문자열
static const char* log_level_strings[] = {
    "ERROR",
    "MQTT", 
    "SERVO",
    "MANUFACTURING",
    "MAINTENANCE",
    "LED"
};

// 로그 파일 핸들
static FILE* log_file = NULL;
static int log_initialized = 0;

// 로그 초기화
int log_init() {
    if (log_initialized) {
        return 0;
    }
    
    // 로그 디렉토리 생성
    system("mkdir -p /var/log");
    
    // 로그 파일 열기 (추가 모드)
    log_file = fopen(LOG_FILE_PATH, "a");
    if (log_file == NULL) {
        printf("로그 파일 열기 실패: %s\n", LOG_FILE_PATH);
        return -1;
    }
    
    log_initialized = 1;
    
    // 초기화 로그 기록
    log_write(LOG_MAINTENANCE, "로그 시스템 초기화 완료");
    
    return 0;
}

// 로그 파일 크기 확인 및 로테이션
void log_check_rotation() {
    if (!log_initialized || !log_file) {
        return;
    }
    
    // 현재 파일 크기 확인
    fseek(log_file, 0, SEEK_END);
    long file_size = ftell(log_file);
    
    if (file_size > LOG_MAX_SIZE) {
        // 로그 파일 닫기
        fclose(log_file);
        
        // 백업 파일 생성
        char backup_path[256];
        time_t now = time(NULL);
        struct tm* tm_info = localtime(&now);
        strftime(backup_path, sizeof(backup_path), 
                "/var/log/perfume_robot_%Y%m%d_%H%M%S.log", tm_info);
        
        // 파일 이름 변경
        rename(LOG_FILE_PATH, backup_path);
        
        // 새 로그 파일 열기
        log_file = fopen(LOG_FILE_PATH, "w");
        if (log_file) {
            log_write(LOG_MAINTENANCE, "로그 파일 로테이션 완료 - 백업: %s", backup_path);
        }
    }
}

// 로그 기록
void log_write(LogLevel level, const char* format, ...) {
    if (!log_initialized || !log_file) {
        return;
    }
    
    // 로그 파일 크기 확인
    log_check_rotation();
    
    // 현재 시간 가져오기
    time_t now = time(NULL);
    struct tm* tm_info = localtime(&now);
    char time_str[26];
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", tm_info);
    
    // 로그 레벨 문자열
    const char* level_str = (level < sizeof(log_level_strings)/sizeof(log_level_strings[0])) 
                           ? log_level_strings[level] : "UNKNOWN";
    
    // 로그 메시지 포맷팅
    va_list args;
    va_start(args, format);
    
    // 임시 버퍼에 메시지 저장
    char message[1024];
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);
    
    // 로그 파일에 기록
    fprintf(log_file, "[%s] [%s] %s\n", time_str, level_str, message);
    fflush(log_file);  // 즉시 디스크에 쓰기
    
    // 콘솔에도 출력 (디버깅용)
    printf("[%s] [%s] %s\n", time_str, level_str, message);
}

// MQTT 송수신 로그
void log_mqtt_transmission(const char* direction, const char* topic, const char* payload) {
    log_write(LOG_MQTT, "MQTT %s - Topic: %s, Payload: %s", direction, topic, payload);
}

// 모터 동작 로그
void log_motor_movement(const char* motor_type, int angle, int duration_ms) {
    log_write(LOG_SERVO, "모터 동작 - 타입: %s, 각도: %d도, 지속시간: %dms", 
              motor_type, angle, duration_ms);
}

// 제조 진행 상황 로그
void log_manufacturing_progress(const char* recipe_name, int step, int total_steps, 
                               const char* status) {
    log_write(LOG_MANUFACTURING, "제조 진행 - 레시피: %s, 단계: %d/%d, 상태: %s", 
              recipe_name, step, total_steps, status);
}

// 제조 완료 로그
void log_manufacturing_complete(const char* recipe_name, int success, 
                               int total_time_ms, const char* result) {
    const char* status = success ? "성공" : "실패";
    log_write(LOG_MANUFACTURING, "제조 완료 - 레시피: %s, 결과: %s, 소요시간: %dms, 상세: %s", 
              recipe_name, status, total_time_ms, result);
}

// 원료 잔량 확인 로그
void log_material_check(const char* material_name, int current_amount, 
                       int required_amount, int available) {
    const char* status = available ? "충분" : "부족";
    log_write(LOG_MAINTENANCE, "원료 확인 - %s: 현재 %dml, 필요 %dml, 상태: %s", 
              material_name, current_amount, required_amount, status);
}

// 시스템 상태 로그
void log_system_status(const char* component, const char* status, const char* details) {
    log_write(LOG_MAINTENANCE, "시스템 상태 - %s: %s, 상세: %s", component, status, details);
}

// 에러 로그
void log_error(const char* component, const char* error_msg, int error_code) {
    log_write(LOG_ERROR, "에러 발생 - %s: %s (코드: %d)", component, error_msg, error_code);
}

// 제조 가능 여부 확인 로그
void log_manufacturing_possibility(const char* recipe_name, int possible, 
                                  const char* reason) {
    const char* status = possible ? "가능" : "불가능";
    log_write(LOG_MANUFACTURING, "제조 가능 여부 - 레시피: %s, 상태: %s, 사유: %s", 
              recipe_name, status, reason);
}

// 원료 용량 업데이트 로그
void log_material_update(const char* material_name, int old_amount, 
                        int new_amount, const char* reason) {
    log_write(LOG_MAINTENANCE, "원료 용량 업데이트 - %s: %dml -> %dml, 사유: %s", 
              material_name, old_amount, new_amount, reason);
}

// LED 신호 로그
void log_led_signal(const char* signal_type, int value) {
    log_write(LOG_LED, "LED 신호 - 타입: %s, 값: %d", signal_type, value);
}

// 로그 파일 읽기 (최근 N줄)
int log_read_recent(char* buffer, int buffer_size, int lines) {
    if (!log_initialized || !log_file) {
        return -1;
    }
    
    // 파일을 읽기 모드로 다시 열기
    FILE* read_file = fopen(LOG_FILE_PATH, "r");
    if (!read_file) {
        return -1;
    }
    
    // 파일 끝에서부터 역순으로 읽기
    char** line_buffer = malloc(lines * sizeof(char*));
    for (int i = 0; i < lines; i++) {
        line_buffer[i] = malloc(256);
    }
    
    int line_count = 0;
    char line[256];
    
    // 모든 줄을 읽어서 버퍼에 저장
    while (fgets(line, sizeof(line), read_file) && line_count < lines) {
        strcpy(line_buffer[line_count], line);
        line_count++;
    }
    
    fclose(read_file);
    
    // 최근 N줄을 버퍼에 복사
    int offset = 0;
    for (int i = 0; i < line_count && offset < buffer_size; i++) {
        int len = strlen(line_buffer[i]);
        if (offset + len < buffer_size) {
            strcpy(buffer + offset, line_buffer[i]);
            offset += len;
        }
    }
    
    // 메모리 해제
    for (int i = 0; i < lines; i++) {
        free(line_buffer[i]);
    }
    free(line_buffer);
    
    return offset;
}

// 로그 정리
void log_cleanup() {
    if (log_file) {
        log_write(LOG_MAINTENANCE, "로그 시스템 종료");
        fclose(log_file);
        log_file = NULL;
    }
    log_initialized = 0;
} 