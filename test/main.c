#include <stdio.h>
#include "../include/valve.h"
#include "../include/servo.h"
#include "../include/mqtt.h"
#include "../include/shared_globals.h"

// 테스트용 Hole 구조체 (shared_globals.h에 정의되어 있을 것으로 가정)
struct Hole test_holes[1] = {
    { .num = 0, .prop = 5.0 }  // num = 0번 밸브, 비율(prop) 임의값
};

int main(void) {
    printf("=== Valve Test Start ===\n");

    // 전역 변수 초기화
    g_recipe_count = 1;

    // 밸브 초기화
    valve_init();
    printf("Valve initialized.\n");

    // 드롭 수와 시간 계산
    update_drop_sec(test_holes);
    printf("Drop/sec data updated.\n");

    // 밸브 열고 닫기 테스트
    printf("Opening valve...\n");
    valve_ctrl(test_holes[0]);
    printf("Valve operation completed.\n");

    printf("=== Valve Test End ===\n");
    return 0;
}
