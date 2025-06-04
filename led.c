// led.c
// LED control implementation

#include "led.h"
#include <stdio.h>

void led_init(void) {
    // Initialize GPIO pin for LED output
    printf("LED initialized\n");
}

void led_on(void) {
    printf("LED turned ON\n");
    // TODO: Set GPIO pin high
}

void led_off(void) {
    printf("LED turned OFF\n");
    // TODO: Set GPIO pin low
}
