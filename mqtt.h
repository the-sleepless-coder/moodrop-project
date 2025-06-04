// mqtt.h
// MQTT communication interface

#ifndef MQTT_H
#define MQTT_H

typedef void (*mqtt_callback_t)(const char* topic, const char* payload);

void mqtt_init(void);
void mqtt_set_callback(mqtt_callback_t cb);
void mqtt_loop(void);

#endif
