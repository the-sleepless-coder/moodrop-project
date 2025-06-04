
#include "mqtt.h"
#include "servo.h"
#include "valve.h"
#include "led.h"
#include "storage.h"
#include "shared_globals.h"
#include "servo_sync.h"
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/time.h>

#define MAX_RECIPE_STEPS 20 // 레시피에 포함될 수 있는 향료의 최대 개수



int main(void) {
    // 사용할 GPIO 핀에 맞게 설정하세요.
    // 라즈베리파이5의 경우 "gpiochip0", 젯슨 오린 나노의 경우 "gpiochip0" 또는 "gpiochip1"일 수 있습니다.
    // 핀 번호는 젯슨 오린 나노 기준으로 GPIO22 (J41 핀 15번)을 예시로 사용합니다.
    const char *chip_name = "gpiochip1";
    unsigned int led_pin = 19;

    // LED 초기화
    if (led_init(chip_name, led_pin) < 0) {
        fprintf(stderr, "LED initialize failed. Exiting.\n");
        return EXIT_FAILURE;
    }

    // 원료량 정보 로드 (MQTT 초기화 전 또는 후에 위치)
    if (load_base_storage() != 0) {
        fprintf(stderr, "Base storage initialize failed. Exiting.\n");
        led_release();
        return EXIT_FAILURE;
    }

    mqtt_init();
    printf("프로그램 시작. 메시지 수신 대기 중...\n");

    while (1) {
        // g_new_recipe_flag가 1이 될 때까지 계속 확인
        if (g_start_manufacturing_flag == 1) {
            
            printf("\n[MAIN] New recipe detected! Checking ingredients...\n");

            // 1. 제조 전 재고 확인인
            if (check_base_stock(g_perfume_recipe, g_recipe_count)) {
                mqtt_publish("perfume/feedback", "{\"CMD\":\"status\", \"data\":{\"status\":\"possible\"}}");
                printf("[MAIN] All ingredients are in stock. Starting manufacture.\n");
                led_off(); // 제조 시작 시 LED OFF

                // 2. 제조 실행
                manufacture(g_perfume_recipe);

                // 3. 제조 완료 후 재고 업데이트
                update_base_storage(g_perfume_recipe, g_recipe_count);

                // 4. 완료 알림
                led_on(); // 제조 완료 시 LED ON
                printf("[MAIN] Manufacture complete. LED is on.\n");
                
                // 5. MQTT 모듈에 상태 보고 지시
                mqtt_publish("perfume/feedback", "{\"CMD\":\"update\", \"data\":{\"status\":\"complete\"}}");

                // 모든 처리가 끝났으므로 깃발을 다시 내림
                g_start_manufacturing_flag = 0;

            } else {
                // 재고 부족 시
                fprintf(stderr, "[MAIN] Manufacture aborted due to insufficient ingredients.\n");
                // 에러 상태를 알리기 위해 LED를 깜빡이거나 MQTT 메시지 전송
                mqtt_publish("perfume/feedback", "{\"CMD\":\"status\", \"data\":{\"status\":\"impossible\"}}");
            }

            printf("[MAIN] Process finished. Returning to idle state.\n\n");
            
        }

        // CPU 자원을 너무 많이 사용하지 않도록 잠시 대기
        usleep(100000); // 0.1초
    }

    mqtt_disconnect();
    led_off();
    led_release();
    return 0;
}