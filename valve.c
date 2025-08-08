// valve.c
// Valve control implementation using servo motor

#include "valve.h"
#include "servo.h"
#include "mqtt.h"
#include <sys/time.h>

float drops[HOLE_CNT + 1];
int sec[HOLE_CNT + 1];

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

void update_drop_sec(struct Hole holes[]){
    for(int i = 0; i < HOLE_CNT; i++){
        int cur = holes[i].num;
        drops[cur] = holes[i].prop * 4 / 10;
        sec[cur] = get_ms(drops[cur]);
    }
}

int get_ms(int drop){ // 600ms 2 drop
    return drop / 2 * 600;
}

// Open valve by setting servo to open angle
// 2 drop -> 600 ms
void valve_ctrl(struct Hole hole) {
    valve_open();
    msleep(sec[hole.num]);
    valve_close();
    msleep(100);
}