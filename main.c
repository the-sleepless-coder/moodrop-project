// main.c
// Main control loop and MQTT message handling for perfume robot

#include <stdio.h>
#include "mqtt.h"
#include "servo.h"
#include "valve.h"
#include "led.h"
#include "recipe.h"

// Manufacturing state flag
volatile int recipe_ready = 0;
Recipe current_recipe;

// Callback function called when MQTT message is received
void on_mqtt_message(const char* topic, const char* payload) {
    printf("MQTT received: %s\n", payload);
    if (parse_recipe(payload, &current_recipe) == 0) {
        recipe_ready = 1;
    }
}

// Perform manufacturing procedure based on recipe
void manufacture() {
    if (!recipe_ready) return;

    for (int i = 0; i < current_recipe.step_count; i++) {
        Step step = current_recipe.steps[i];

        // 1) Rotate the 2nd tier disc to target position
        servo_set_angle(SERVO_ROTATE, step.position_angle);

        // Wait for servo to move
        delay_ms(1000);

        // 2) Open valve and dispense for specified time
        valve_open();
        delay_ms(step.dispense_time_ms);
        valve_close();

        delay_ms(500);
    }

    // Turn on LED to indicate completion
    led_on();
    recipe_ready = 0;
}

int main(void) {
    printf("Fragrance manufacturing robot started\n");

    mqtt_init();
    mqtt_set_callback(on_mqtt_message);

    servo_init();
    valve_init();
    led_init();

    while(1) {
        mqtt_loop();   // Handle MQTT events
        manufacture();
        delay_ms(100);
    }

    return 0;
}
