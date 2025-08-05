// mqtt.h
// MQTT communication interface

#ifndef MQTT_H
#define MQTT_H
#define HOLE_CNT 4
// 콜백 함수 포인터 타입 정의
typedef void (*mqtt_callback_t)(const char* topic, const char* payload);

// 향료 정보 구조체
struct Hole{
    int num;
    int prop;
};

// MQTT 함수 선언
void mqtt_init(void);
void mqtt_set_callback(mqtt_callback_t cb);
void mqtt_loop(void);
void mqtt_disconnect(void); // 종료 시 호출할 함수 추가

#endif