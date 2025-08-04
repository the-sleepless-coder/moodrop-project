// MQTT.c
// MQTT 통신 모듈 - 메시지 수신, 파싱, 송신 담당

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "MQTT.h"
#include "log.h"
#include "BaseStorage.h"

// MQTT 클라이언트 상태
static int mqtt_connected = 0;
static char client_id[64];
static char broker_address[128];
static int broker_port;

// 콜백 함수 포인터
static mqtt_message_callback_t message_callback = NULL;

// MQTT 초기화
int mqtt_init(const char* broker, int port, const char* client) {
    strcpy(broker_address, broker);
    broker_port = port;
    strcpy(client_id, client);
    
    // MQTT 연결 시도
    mqtt_connected = 1; // 실제 구현에서는 연결 상태 확인
    
    // 로그 기록
    log_write(LOG_MQTT, "MQTT 초기화 완료 - Broker: %s:%d, Client: %s", 
              broker_address, broker_port, client_id);
    
    return 0;
}

// 메시지 콜백 설정
void mqtt_set_callback(mqtt_message_callback_t callback) {
    message_callback = callback;
}

// 메시지 수신 처리
void mqtt_receive_message(const char* topic, const char* payload) {
    if (!mqtt_connected) {
        log_write(LOG_ERROR, "MQTT 연결되지 않음 - 메시지 수신 실패");
        return;
    }
    
    // 로그 기록
    log_write(LOG_MQTT, "메시지 수신 - Topic: %s, Payload: %s", topic, payload);
    
    // 메시지 파싱
    if (strstr(topic, "recipe") != NULL) {
        Recipe recipe;
        if (parse_recipe(payload, &recipe) == 0) {
            // 제조 가능 여부 확인
            if (check_manufacturing_possibility(&recipe)) {
                // 제조 시작 신호 전송
                mqtt_send_signal("manufacturing/start", "ready");
                log_write(LOG_MANUFACTURING, "제조 시작 준비 완료");
            } else {
                // 원료 부족 신호 전송
                mqtt_send_signal("manufacturing/error", "insufficient_materials");
                log_write(LOG_MANUFACTURING, "원료 부족으로 제조 불가");
            }
        }
    } else if (strstr(topic, "status") != NULL) {
        // 상태 요청 처리
        char status_msg[256];
        get_system_status(status_msg);
        mqtt_send_signal("status/response", status_msg);
    }
    
    // 콜백 함수 호출
    if (message_callback) {
        message_callback(topic, payload);
    }
}

// 신호 전송
void mqtt_send_signal(const char* topic, const char* message) {
    if (!mqtt_connected) {
        log_write(LOG_ERROR, "MQTT 연결되지 않음 - 신호 전송 실패");
        return;
    }
    
    // 로그 기록
    log_write(LOG_MQTT, "신호 전송 - Topic: %s, Message: %s", topic, message);
    
    // 실제 MQTT 전송 구현
    printf("MQTT 전송: %s -> %s\n", topic, message);
}

// 레시피 파싱
int parse_recipe(const char* payload, Recipe* recipe) {
    // JSON 파싱 구현 (간단한 예시)
    // 실제로는 JSON 라이브러리 사용
    memset(recipe, 0, sizeof(Recipe));
    
    // 간단한 파싱 예시
    if (strstr(payload, "perfume1") != NULL) {
        recipe->id = 1;
        recipe->name = "Perfume 1";
        recipe->step_count = 3;
        
        // 스텝 설정
        recipe->steps[0].position_angle = 0;
        recipe->steps[0].dispense_time_ms = 1000;
        recipe->steps[1].position_angle = 120;
        recipe->steps[1].dispense_time_ms = 1500;
        recipe->steps[2].position_angle = 240;
        recipe->steps[2].dispense_time_ms = 800;
        
        return 0;
    }
    
    return -1; // 파싱 실패
}

// MQTT 루프 처리
void mqtt_loop() {
    if (!mqtt_connected) {
        return;
    }
    
    // MQTT 이벤트 처리
    // 실제 구현에서는 MQTT 라이브러리의 루프 함수 호출
}

// 연결 상태 확인
int mqtt_is_connected() {
    return mqtt_connected;
}

// 연결 해제
void mqtt_disconnect() {
    mqtt_connected = 0;
    log_write(LOG_MQTT, "MQTT 연결 해제");
}
