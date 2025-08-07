// valve.h
// Valve control interface

#ifndef VALVE_H
#define VALVE_H
#include "mqtt.h"
#include <stdio.h>

void valve_init(void);
void valve_open(void);
void valve_close(void);
void get_drops(struct Hole holes[]);
int get_ms(int drop);
void valve_ctrl(struct Hole hole);

#endif
