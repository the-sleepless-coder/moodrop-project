#include "servo.h"
#include "valve.h"
#include <stdio.h>

void start_servos(struct Hole holes[]){
    curAngle += get_angle(INIT_POS, holes[0].num);
    update_drop_sec(holes);
    plate_spin(curAngle); // 첫번째 루트로 가기
    msleep(PLATE_SPIN_TIME * abs(INIT_POS - holes[0].num));
    valve_ctrl(holes[0]);
    msleep(500);
    for(int i = 1; i < g_recipe_count; i++){ // 2, 3, 4번째 루트로 가기
        curAngle += get_angle(holes[i - 1].num, holes[i].num);
        plate_spin(curAngle);
        msleep(PLATE_SPIN_TIME * abs(holes[i - 1].num - holes[i].num));
        valve_ctrl(holes[i]);
        msleep(500);
    }
    plate_spin(60);
    msleep(100);
}

void manufacture(struct Hole holes[]){
    printf("manufacturing...\n");
    servo_init(SERVO_ROTATE);
    servo_init(SERVO_VALVE);
    start_servos(holes);
}