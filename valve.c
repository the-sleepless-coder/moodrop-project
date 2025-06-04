// valve.c
// Valve control implementation using servo motor

#include "valve.h"
#include "servo.h"

// Initialize valve servo (valve closed by default)
void valve_init(void) {
    servo_init();
    valve_close();
}

// Open valve by setting servo to open angle
void valve_open(void) {
    servo_set_angle(SERVO_VALVE, 90); // Example open angle
}

// Close valve by setting servo to closed angle
void valve_close(void) {
    servo_set_angle(SERVO_VALVE, 0); // Example closed angle
}


