#include "servo.h"
#include "valve.h"
#include <stdio.h>

void start_servos(struct Hole holes[]){
    int lastAngle = curAngle;
    curAngle += get_angle(INIT_POS, holes[0].num);
    update_drop_sec(holes);
    plate_spin(lastAngle, false); // 첫번째 루트로 가기
    msleep(PLATE_SPIN_TIME * abs(INIT_POS - holes[0].num));
    valve_ctrl(holes[0]);
    msleep(500);
    printf("%d\n", curAngle);
    for(int i = 1; i < g_recipe_count; i++){ // 1, 2, 3, 4번째 루트로 가기
        lastAngle = curAngle;
        curAngle += get_angle(holes[i - 1].num, holes[i].num);
        plate_spin(lastAngle, false);
        msleep(PLATE_SPIN_TIME * abs(holes[i - 1].num - holes[i].num));
        valve_ctrl(holes[i]);
        msleep(500);
        printf("%d\n", curAngle);
    }
    printf("hi %d\n", curAngle);
    lastAngle = curAngle;
    curAngle = 60;
    plate_spin(lastAngle, true);
    msleep(100);
}

void manufacture(struct Hole holes[]){
    printf("manufacturing...\n");
    servo_init(SERVO_ROTATE);
    servo_init(SERVO_VALVE);
    start_servos(holes);
}