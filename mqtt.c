// mqtt.c
// MQTT communication implementation using Mosquitto
//sdfsdfds

#include "mqtt.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <mosquitto.h>

// --- 설정값 (본인의 환경에 맞게 수정하세요) ---
#define MQTT_BROKER_ADDRESS   "localhost" // 예: "192.168.0.1"
#define MQTT_PORT             1883
#define MQTT_CLIENT_ID        "jetson-nano-perfume-device"
#define MQTT_TOPIC            "perfume/recipe"
#define MQTT_QOS              1
// -----------------------------------------

static struct mosquitto *mosq = NULL;
static mqtt_callback_t user_cb = NULL;

// Mosquitto: 메시지 수신 시 호출될 콜백
void on_message_callback(struct mosquitto *mosq, void *userdata, const struct mosquitto_message *message) {
    if (message->payloadlen) {
        printf("메시지 수신: Topic: %s, Payload: %s\n", message->topic, (char*)message->payload);
        if (user_cb) {
            // 사용자가 등록한 콜백 함수 호출
            user_cb(message->topic, (char*)message->payload);
        }
    }
}

// Mosquitto: 브로커 접속 성공 시 호출될 콜백
void on_connect_callback(struct mosquitto *mosq, void *userdata, int result) {
    if (!result) {
        printf("MQTT 브로커에 성공적으로 연결되었습니다.\n");
        // 연결 성공 후 토픽 구독
        int rc = mosquitto_subscribe(mosq, NULL, MQTT_TOPIC, MQTT_QOS);
        if(rc != MOSQ_ERR_SUCCESS){
            fprintf(stderr, "오류: 토픽 구독에 실패했습니다: %s\n", mosquitto_strerror(rc));
        } else {
            printf("토픽 '%s'를 구독합니다.\n", MQTT_TOPIC);
        }
    } else {
        fprintf(stderr, "MQTT 브로커 연결 실패: %s\n", mosquitto_connack_string(result));
    }
}

// MQTT 초기화
void mqtt_init(void) {
    int rc;

    // 1. Mosquitto 라이브러리 초기화
    mosquitto_lib_init();

    // 2. Mosquitto 클라이언트 인스턴스 생성
    mosq = mosquitto_new(MQTT_CLIENT_ID, true, NULL);
    if (!mosq) {
        fprintf(stderr, "오류: Mosquitto 클라이언트 생성 실패\n");
        exit(EXIT_FAILURE);
    }

    // 3. 콜백 함수들 등록
    mosquitto_connect_callback_set(mosq, on_connect_callback);
    mosquitto_message_callback_set(mosq, on_message_callback);

    // 4. 브로커에 연결 (비동기)
    rc = mosquitto_connect(mosq, MQTT_BROKER_ADDRESS, MQTT_PORT, 60);
    if (rc != MOSQ_ERR_SUCCESS) {
        fprintf(stderr, "오류: 브로커에 연결할 수 없습니다: %s\n", mosquitto_strerror(rc));
        mosquitto_destroy(mosq);
        mosquitto_lib_cleanup();
        exit(EXIT_FAILURE);
    }

    // 5. 네트워크 통신을 위한 백그라운드 스레드 시작
    rc = mosquitto_loop_start(mosq);
    if (rc != MOSQ_ERR_SUCCESS) {
        fprintf(stderr, "오류: Mosquitto 루프 시작 실패: %s\n", mosquitto_strerror(rc));
        mosquitto_destroy(mosq);
        mosquitto_lib_cleanup();
        exit(EXIT_FAILURE);
    }
}

// 사용자가 정의한 콜백 함수 등록
void mqtt_set_callback(mqtt_callback_t cb) {
    user_cb = cb;
}

// `mosquitto_loop_start()`를 사용하므로 이 함수는 비워둬도 무방합니다.
void mqtt_loop(void) {
    // 백그라운드 스레드가 모든 것을 처리합니다.
}

// MQTT 연결 종료
void mqtt_disconnect(void) {
    mosquitto_loop_stop(mosq, true);
    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    printf("MQTT 연결이 종료되었습니다.\n");
}