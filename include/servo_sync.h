// valve.h
// Valve control interface

#ifndef SERVO_SYNC_H
#define SERVO_SYNC_H
#include "mqtt.h"
#include "servo.h"
#include "valve.h"
#include "shared_globals.h"
#include <stdio.h>

void start_servos(struct Hole holes[]);
void manufacture(struct Hole holes[]);
int isFirstSecond(struct Hole hole);

#endif
