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
    servo_set_angle(SERVO_VALVE, 0);
}

int get_ms(int drop){ // 600ms 2 drop
    return drop / 2 * 600;
}

void get_drops(struct Hole holes[]){
    for(int i = 0; i < HOLE_CNT; i++){
        int cur = holes[i].num;
        drops[cur] = holes[i].prop * 4 / 10;
        sec[cur] = get_ms(drops[cur]);
    }
}

// Open valve by setting servo to open angle
// 2 drop -> 600 ms
void valve_ctrl(struct Hole hole) {
    struct timeval start, end;
    int time = get_ms(drops[hole.num]);
    gettimeofday(&start, NULL);
    // 여닫는 데 100 MS
    valve_open();
    msleep(time);
    valve_close();
    msleep(100);
    gettimeofday(&end, NULL);
    long elapsed_time = (end.tv_sec - start.tv_sec) * 1000L + (end.tv_usec - start.tv_usec) / 1000L;
    printf("Valve open-close took %ld ms\n", elapsed_time);
    printf("%d Time waiting ...\n", time);
}