// led.h
// LED control interface using libgpiod

#ifndef LED_H
#define LED_H

#include <gpiod.h>

// Initialize the LED and GPIO line
// chip_name: The name of the GPIO chip (e.g., "gpiochip0")
// line_offset: The offset of the GPIO line to be used
int led_init(const char *chip_name, unsigned int line_offset);

// Turn the LED on
void led_on(void);

// Turn the LED off
void led_off(void);

// Release the LED and GPIO resources
void led_release(void);

#endif