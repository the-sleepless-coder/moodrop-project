// main.c
// Main control loop and MQTT message handling for perfume robot

#include <stdio.h>
#include "mqtt.h"
#include "servo_sync.h"
#include "servo.h"
#include "valve.h"
#include "led.h"
#include "shared_globals.h"
#include <stdlib.h>
#include <unistd.h>
#include <cjson/cJSON.h>


int main(void) {
    // 1. MQTT 모듈 초기화
    // 내부적으로 메시지 수신, 파싱, 명령어 처리까지 모두 준비됩니다.
    mqtt_init();
    printf("프로그램 시작. 명령 수신 대기 중...\n");

    // 2. 메인 루프: 상태를 감시하고, 각 모듈에 작업 지시
    while (1) {
        // g_start_manufacturing_flag는 MQTT 모듈이 'manufacture' 명령을 받으면 1로 변경합니다.
        if (g_start_manufacturing_flag == 1) {
            
            // 모터 제어 모듈에 작업 지시
            manufacture(g_perfume_recipe);

            // MQTT 모듈에 상태 보고 지시
            mqtt_publish("perfume/feedback", "{\"CMD\":\"status\", \"data\":\"제조 완료\"}");
            
            // 상태 플래그를 다시 0으로 초기화
            g_start_manufacturing_flag = 0;
            printf("\n[MAIN] 작업 완료. 다시 대기 상태로 전환합니다.\n");
        }
        
        // CPU 자원을 너무 많이 사용하지 않도록 잠시 대기
        usleep(100000); // 0.1초
    }

    mqtt_disconnect();
    return 0;
}
