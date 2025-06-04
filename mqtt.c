// mqtt.c
// MQTT communication implementation (stub / mock for example)

#include "mqtt.h"
#include <stdio.h>

static mqtt_callback_t user_cb = NULL;

void mqtt_init(void) {
    // Initialize MQTT connection here
    printf("MQTT initialized\n");
}

void mqtt_set_callback(mqtt_callback_t cb) {
    user_cb = cb;
}

// Mock function to simulate MQTT message reception
void mqtt_mock_receive(const char* topic, const char* payload) {
    if (user_cb) {
        user_cb(topic, payload);
    }
}

void mqtt_loop(void) {
    // Periodically handle MQTT events
    // For example, call mqtt_mock_receive() for testing
}
