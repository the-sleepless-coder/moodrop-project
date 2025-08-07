// valve.c
// Valve control implementation using servo motor

#include "valve.h"
#include "servo.h"
#include "mqtt.h"

float drops[HOLE_CNT + 1];

// Initialize valve servo (valve closed by default)
void valve_init(void) {
    servo_init(SERVO_VALVE);
    valve_close();
}

void valve_open(void) {
    servo_set_angle(SERVO_VALVE, 85); // 추후 수정 필요   
}

// Close valve by setting servo to closed angle
void valve_close(void) {
    servo_set_angle(SERVO_VALVE, 0); // Example closed angle
    msleep(100);
}

void get_drops(struct Hole holes[]){
    int sum = 0;
    for(int i = 0; i < HOLE_CNT; i++)
        sum += holes[i].prop;
    
    for(int i = 0; i < HOLE_CNT; i++)
        drops[holes[i].num] = (float) holes[i].prop / (float) sum * 100;
}

int get_ms(int drop){ // 1 sec 1 drop
    return drop * 1000;
}

// Open valve by setting servo to open angle
void valve_ctrl(struct Hole hole) {
    int time = get_ms(drops[hole.num]);
    valve_open();
    msleep(1000);
    valve_close();
    printf("%d Time waiting ...\n", time);
}