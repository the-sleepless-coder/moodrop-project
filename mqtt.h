// MQTT.h
// MQTT 통신 모듈 헤더 파일

#ifndef MQTT_H
#define MQTT_H

#include "servo.h"  // Recipe 구조체 정의

// MQTT 메시지 콜백 함수 타입
typedef void (*mqtt_message_callback_t)(const char* topic, const char* payload);

// MQTT 초기화
int mqtt_init(const char* broker, int port, const char* client);

// 메시지 콜백 설정
void mqtt_set_callback(mqtt_message_callback_t callback);

// 메시지 수신 처리
void mqtt_receive_message(const char* topic, const char* payload);

// 신호 전송
void mqtt_send_signal(const char* topic, const char* message);

// 레시피 파싱
int parse_recipe(const char* payload, Recipe* recipe);

// MQTT 루프 처리
void mqtt_loop();

// 연결 상태 확인
int mqtt_is_connected();

// 연결 해제
void mqtt_disconnect();

#endif // MQTT_H
