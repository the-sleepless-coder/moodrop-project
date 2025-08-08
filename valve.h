// valve.h
// Valve control interface

#ifndef VALVE_H
#define VALVE_H
#include "mqtt.h"
#include "shared_globals.h"
#include <stdio.h>
#define VALVE_TIME 1300

extern float drops[20];
extern int sec[20];

void valve_init(void);
void valve_open(void);
void valve_close(void);
void update_drop_sec(struct Hole holes[]);
int get_ms(int drop);
void valve_ctrl(struct Hole hole);

#endif
