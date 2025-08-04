// LED.h
// LED 제어 모듈 헤더 파일

#ifndef LED_H
#define LED_H

// LED 패턴 정의
typedef enum {
    LED_PATTERN_READY = 0,
    LED_PATTERN_WORKING,
    LED_PATTERN_SUCCESS,
    LED_PATTERN_ERROR,
    LED_PATTERN_WARNING
} LEDPattern;

// LED 초기화
int led_init();

// LED 켜기
int led_on();

// LED 끄기
int led_off();

// LED 토글
int led_toggle();

// LED 깜빡임 시작
int led_start_blink(int interval_ms);

// LED 깜빡임 정지
int led_stop_blink();

// LED 깜빡임 처리 (메인 루프에서 호출)
void led_process_blink();

// 신호 전송
void led_send_signal(const char* signal_type, int value);

// 제조 완료 신호
void led_manufacturing_complete();

// 에러 신호
void led_error_signal();

// 제조 시작 신호
void led_manufacturing_start();

// 현재 LED 상태 반환
int led_get_state();

// 깜빡임 모드 상태 반환
int led_get_blink_mode();

// LED 패턴 표시
void led_show_pattern(LEDPattern pattern);

// LED 정리
void led_cleanup();

#endif // LED_H
