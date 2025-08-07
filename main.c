
#include <stdio.h>
#include "mqtt.h"
#include "servo.h"
#include "valve.h"
#include "led.h"
#include <stdlib.h>
#include <unistd.h>
#include <cjson/cJSON.h>

#define MAX_RECIPE_STEPS 20 // 레시피에 포함될 수 있는 향료의 최대 개수


// 레시피 전체를 저장할 전역 구조체 배열
struct Hole g_perfume_recipe[MAX_RECIPE_STEPS]; 

// 수신된 레시피의 실제 개수를 저장할 전역 변수
int g_recipe_count = 0;
volatile int g_new_recipe_flag = 0; // 0: 새 레시피 없음, 1: 새 레시피 도착

// ## 3. MQTT 콜백 함수 수정 ##
// =================================================================
// 이제 이 함수는 전역 변수에 데이터를 저장하고 깃발만 올리는 역할을 합니다.
void my_mqtt_callback(const char* topic, const char* payload) {
    printf("\n[MQTT] 메시지 수신! 파싱 시작...\n");

    cJSON *json_array = cJSON_Parse(payload);
    if (!json_array) return;

    g_recipe_count = 0; // 새 레시피를 저장하기 전에 이전 개수를 초기화

    if (cJSON_IsArray(json_array)) {
        cJSON *element = NULL;
        int i = 0;
        cJSON_ArrayForEach(element, json_array) {
            if (i >= MAX_RECIPE_STEPS) break;

            const cJSON *num_json = cJSON_GetObjectItemCaseSensitive(element, "num");
            const cJSON *prop_json = cJSON_GetObjectItemCaseSensitive(element, "prop");

            if (cJSON_IsNumber(num_json) && cJSON_IsNumber(prop_json)) {
                // 전역 변수 g_perfume_recipe에 직접 저장
                g_perfume_recipe[i].num = num_json->valueint;
                g_perfume_recipe[i].prop = prop_json->valueint;
                g_recipe_count++;
            }
            i++;
        }
    }
    cJSON_Delete(json_array);

    if (g_recipe_count > 0) {
        printf("[MQTT] 파싱 완료. %d개의 레시피 저장됨.\n", g_recipe_count);
        g_new_recipe_flag = 1; // 새 레시피가 도착했음을 알리는 깃발을 올림
    }
}

void manufacture(struct Hole holes[]){
    servo_init(SERVO_ROTATE);
    servo_init(SERVO_VALVE);
    start_servos(holes, SERVO_ROTATE);
}


int main(void) {
    mqtt_init();
    mqtt_set_callback(my_mqtt_callback);
    printf("프로그램 시작. MQTT 메시지 수신 대기 중...\n");

    while (1) {
        // g_new_recipe_flag가 1이 될 때까지 계속 확인
        if (g_new_recipe_flag == 1) {
            printf("\n[MAIN] 새 레시피 감지! 제조를 시작합니다.\n");
            servo_init(SERVO_ROTATE);
            msleep(1000);
            //servo_init(SERVO_VALVE);
            // 전역 변수에 저장된 레시피를 순서대로 처리
            //plate_spin(g_perfume_recipe, SERVO_ROTATE);
            manufacture(g_perfume_recipe);
            printf("[MAIN] 제조 완료. 다시 대기 상태로 전환합니다.\n\n");
            
            // 모든 처리가 끝났으므로 깃발을 다시 내림
            g_new_recipe_flag = 0;
        }

        // CPU 자원을 너무 많이 사용하지 않도록 잠시 대기
        usleep(100000); // 0.1초
    }

    mqtt_disconnect();
    return 0;
}