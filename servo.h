// servo.h
// Servo motor control interface

#ifndef SERVO_H
#define SERVO_H
#define ROTATE_ANGLE 30
#define INIT_POS 3

typedef enum {
    SERVO_ROTATE, // Servo controlling the rotation of 2nd tier
    SERVO_VALVE   // Servo controlling the valve opening
} ServoID;

struct QUAN{
    int num;

}

void servo_init(void);
void servo_set_angle(ServoID id, int angle);

#endif
