// servo.h
// Servo motor control interface

#ifndef SERVO_H
#define SERVO_H
#define INIT_POS 3
#define I2C_DEV "/dev/i2c-7"
#define PCA9685_ADDR 0x60
#define MODE1 0x00
#define PRESCALE 0xFE
#include <stdlib.h>
#include <stdint.h>
#include <time.h>
#include "mqtt.h"
#include "valve.h"

// PCA9685 각 채널 base address
#define LED0_ON_L  0x06

// 서보용 PWM 값 (데이터시트 참고)
#define SERVOMIN 120  // 0도
#define SERVOMAX 620  // 180도

typedef enum {
    SERVO_ROTATE, // Servo controlling the rotation of 2nd tier
    SERVO_VALVE   // Servo controlling the valve opening
} ServoID;


void msleep(int ms);
int get_servo_channel(ServoID id);
void pca9685_write(int fd, uint8_t reg, uint8_t value);
void set_pwm(int fd, uint8_t channel, uint16_t on, uint16_t off);
uint16_t angle_to_pulse(int angle);
void pca9685_init(int fd);
void servo_init(ServoID id);
void servo_set_angle(ServoID id, int angle);
void start_servos(struct Hole holes[], ServoID id);

#endif
