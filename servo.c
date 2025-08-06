// servo.c

#include "servo.h"
#include <stdio.h>
#include <unistd.h> // sleep 함수 사용

void manufacture_process(struct Hole recipe[], int count) {
    printf("[MOTOR] %d단계의 제조 공정을 시작합니다.\n", count);
    for (int i=0; i<count; i++) {
        printf("   - (플레이트 회전) -> %d번 향료로 이동\n", recipe[i].num);
        sleep(1);
        printf("   - (밸브 조작) -> %d%% 비율로 분사\n", recipe[i].prop);
        sleep(1);
    }
    // TODO: 실제 servo_init(), plate_spin() 등 함수 호출 로직 구현
    printf("[MOTOR] 제조 공정 완료.\n");
}