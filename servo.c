// servo.c
// Servo motor control implementation (PCA9685 control to be implemented)

#include "servo.h"
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <linux/i2c-dev.h>
#include <sys/ioctl.h>
#include <stdint.h>
#include <time.h>
#include <sys/time.h>
#include "valve.h"

int fd, curAngle;

void msleep(int ms) {
    struct timespec req = {ms/1000, (ms%1000)*1000000};
    nanosleep(&req, NULL);
}

int get_servo_channel(ServoID id) {
    switch (id) {
        case SERVO_ROTATE: return 0;  // 0번 채널
        case SERVO_VALVE:  return 1;  // 1번 채널
        default: return -1;            // fallback
    }
}

void pca9685_write(int fd, uint8_t reg, uint8_t value) {
    uint8_t buf[2] = {reg, value};
    if (write(fd, buf, 2) != 2)
        perror("I2C Write error");
}

// 최대 4096 (12bit)의 PWM steps
void set_pwm(int fd, uint8_t channel, uint16_t on, uint16_t off) {
    uint8_t reg = LED0_ON_L + 4 * channel;
    uint8_t buf[5] = {reg, on & 0xFF, on >> 8, off & 0xFF, off >> 8};
    if (write(fd, buf, 5) != 5)
        perror("I2C PWM set error");
}

// 각도를 Pulse(0~4095)로 변환
uint16_t angle_to_pulse(int angle) {
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;
    return SERVOMIN + (angle * (SERVOMAX - SERVOMIN) / 180);
}

void pca9685_init(int fd) {
    // 1. Enter sleep mode to set prescale
    pca9685_write(fd, MODE1, 0x10);  // Sleep mode

    // 2. Set prescaler for 50Hz (for servos)
    pca9685_write(fd, PRESCALE, 0x79);  // 121 decimal

    // 3. Wake up (clear sleep), auto-increment enabled
    pca9685_write(fd, MODE1, 0x20);  // AI=1, SLEEP=0

    // 4. (Optional) Short delay to let oscillator stabilize
    msleep(1);

    // 5. Restart PWM output
    pca9685_write(fd, MODE1, 0xA1);  // Restart + AI
}

// Initialize PCA9685 and servos here
void servo_init(ServoID id) {
    fd = open(I2C_DEV, O_RDWR);
    if(fd < 0){
        perror("I2C open failed");
        return;
    }
    if (ioctl(fd, I2C_SLAVE, PCA9685_ADDR) < 0) {
        perror("I2C address set fail");
        close(fd);
        return;
    }

    printf("PCA9685 initializing at 0x60...\n");
    pca9685_init(fd);

    int ch = get_servo_channel(id);
    if(ch == SERVO_ROTATE){
        printf("Servo %d (channel %d) will be set to 60 deg (center)...\n", id, ch);
        set_pwm(fd, ch, 0, angle_to_pulse(60));
        curAngle = 60;
        msleep(100);
    }
    else if(ch == SERVO_VALVE){
        printf("Servo %d (channel %d) will be set to 60 deg (center)...\n", id, ch);
        set_pwm(fd, ch, 0, angle_to_pulse(0));
        msleep(100);
    }
    printf("Servo motors initialized\n");
}


// Set servo angle (convert to PWM signal and send to PCA9685)
void servo_set_angle(ServoID id, int angle) {
    int ch = get_servo_channel(id);
    set_pwm(fd, ch, 0, angle_to_pulse(angle));
    printf("Set servo %d angle to %d degrees\n", id, angle);
}

int get_angle(int src, int dst){
    int relativeDist = dst - src;
    return relativeDist * 30;
}

void plate_spin(int angle){
    servo_set_angle(SERVO_ROTATE, angle);
}

void start_servos(struct Hole holes[]){
    curAngle += get_angle(INIT_POS, holes[0].num);
    get_drops(holes);
    plate_spin(curAngle); // 첫번째 루트로 가기
    msleep(PLATE_SPIN_TIME * abs(INIT_POS - holes[0].num));
    valve_ctrl(holes[0]);
    msleep(200 + sec[holes[0].num]);
    printf("기다릴 시간 : %d\n", sec[holes[0].num]);
    for(int i = 1; i < HOLE_CNT; i++){ // 2, 3, 4번째 루트로 가기
        curAngle += get_angle(holes[i - 1].num, holes[i].num);
        plate_spin(curAngle);
        msleep(PLATE_SPIN_TIME * abs(holes[i - 1].num - holes[i].num));
        valve_ctrl(holes[i]);
        msleep(200 + sec[holes[i].num]);
        printf("기다릴 시간 : %d\n", sec[holes[i].num]);
    }
    plate_spin(60);
    msleep(100);
}

// 2. plate 시간 맞춰서 멈추는 기능 구헌