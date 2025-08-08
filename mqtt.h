// mqtt.h
// MQTT communication interface

#ifndef MQTT_H
#define MQTT_H
#define HOLE_CNT 4
#define MAX_RECIPE_STEPS 20 // 레시피에 포함될 수 있는 향료의 최대 개수

#include "shared_globals.h"

// 콜백 함수 포인터 타입 정의
typedef void (*mqtt_callback_t)(const char* topic, const char* payload);

// 전역 변수 선언
extern struct Hole g_perfume_recipe[MAX_RECIPE_STEPS];
extern int g_recipe_count;
extern volatile int g_new_recipe_flag;

// MQTT 함수 선언
void mqtt_init(void);
void mqtt_set_callback(mqtt_callback_t cb);
void mqtt_loop(void);
void mqtt_disconnect(void); // 종료 시 호출할 함수 추가
void mqtt_publish(const char* topic, const char* payload);

// 내부 콜백 함수 선언
void my_mqtt_callback(const char* topic, const char* payload);

#endif