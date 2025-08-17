// log.h
// Simple logging interface for the perfume robot

#ifndef LOG_H
#define LOG_H

#include <stdbool.h>

/**
 * @brief 로그 시스템을 초기화합니다.
 * 프로그램 시작 시 한 번만 호출됩니다.
 * "log_YYYY-MM-DD_HH-MM-SS.txt" 형식으로 로그 파일을 생성합니다.
 * @return 성공 시 0, 실패 시 -1을 반환합니다.
 */
void log_init(void);

/**
 * @brief 파일에 로그 메시지를 기록합니다.
 * @param format printf와 동일한 형식의 문자열
 * @param ... 형식 문자열에 들어갈 가변 인자
 */
void log_message(const char *format, ...);

/**
 * @brief 로그 파일을 닫고 리소스를 정리합니다.
 * 프로그램 종료 시 호출됩니다.
 */
void log_close(void);

#endif // LOG_H
