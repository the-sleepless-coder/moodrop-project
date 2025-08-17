// log.c
// Implementation of the simple logger

#include "log.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <stdarg.h>
#include <sys/stat.h>
#include <errno.h>

// 로그 파일 포인터를 이 파일 내에서만 접근 가능하도록 static으로 선언
static FILE *log_file = NULL;

void log_init(void) {
    // 0. 로그 디렉토리 생성
    const char* log_dir = "Log";
    // mkdir 함수는 성공 시 0, 실패 시 -1을 반환합니다.
    if (mkdir(log_dir, 0755) == -1) {
        // 디렉토리가 이미 존재하는 경우(EEXIST)는 에러가 아니므로 무시합니다.
        if (errno != EEXIST) {
            perror("Failed to create log directory");
            exit(EXIT_FAILURE);
        }
    }
    
    // 1. 현재 시간을 기반으로 파일 이름 생성
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    char filename[100];

    // 파일 이름 형식: log_YYYY-MM-DD_HH-MM-SS.txt
    strftime(filename, sizeof(filename), "./Log/log_%Y-%m-%d_%H-%M-%S.txt", t);

    // 2. 로그 파일 열기 (쓰기 모드)
    log_file = fopen(filename, "w");
    if (log_file == NULL) {
        perror("Failed to open log file\n");
        fprintf(stderr, "log file initialize failed. Exiting.\n");
        exit(EXIT_FAILURE);
    }

    // 3. 로그 파일 생성 성공 메시지 기록
    log_message("Logging started. Log file: %s", filename);
    printf("Log file created: %s\n", filename);
}

void log_message(const char *format, ...) {
    if (log_file == NULL) {
        fprintf(stderr, "Logger not initialized.\n");
        return;
    }

    // 1. 현재 시간 문자열 생성 (YYYY-MM-DD HH:MM:SS)
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    char time_str[20];
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", t);

    // 2. 로그 메시지 앞에 타임스탬프 추가
    fprintf(log_file, "[%s] ", time_str);

    // 3. 가변 인자를 처리하여 실제 로그 메시지 작성
    va_list args;
    va_start(args, format);
    vfprintf(log_file, format, args);
    va_end(args);

    // 4. 줄바꿈 추가
    fprintf(log_file, "\n");

    // 5. (중요) 버퍼를 비워 파일에 즉시 쓰도록 함 (프로그램 비정상 종료 시 로그 유실 방지)
    fflush(log_file);
}

void log_close(void) {
    if (log_file != NULL) {
        log_message("Logging finished.");
        fclose(log_file);
        log_file = NULL;
    }
}
