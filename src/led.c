// led.c
// LED control implementation using libgpiod

#include "led.h"
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

// libgpiod resources
static struct gpiod_chip *chip = NULL;
static struct gpiod_line *line = NULL;
static unsigned int g_line_offset = 0;

// Initialize the LED and GPIO line
int led_init(const char *chip_name, unsigned int line_offset) {
    g_line_offset = line_offset;

    // Open the GPIO chip
    chip = gpiod_chip_open_by_name(chip_name);
    if (!chip) {
        perror("Failed to open GPIO chip");
        return -1;
    }

    // Get the GPIO line
    line = gpiod_chip_get_line(chip, g_line_offset);
    if (!line) {
        perror("Failed to get GPIO line");
        gpiod_chip_close(chip);
        chip = NULL;
        return -1;
    }

    // Request the line as an output
    if (gpiod_line_request_output(line, "led-control", 0) < 0) {
        perror("Failed to request line as output");
        gpiod_chip_close(chip);
        line = NULL;
        chip = NULL;
        return -1;
    }

    printf("LED initialized on %s, line %u\n", chip_name, line_offset);
    return 0;
}

// Turn the LED on
void led_on(void) {
    if (line) {
        for(int i=0;i<50;i++){
            gpiod_line_set_value(line, 1);
            msleep(100);
            gpiod_line_set_value(line, 0);
            msleep(100);
        }
        gpiod_line_set_value(line, 1);
        printf("LED turned on\n");
    } else {
        fprintf(stderr, "LED is not initialized.\n");
    }
}

// Turn the LED off
void led_off(void) {
    if (line) {
        gpiod_line_set_value(line, 0);
        printf("LED turned off\n");
    } else {
        fprintf(stderr, "LED is not initialized.\n");
    }
}

// Release the LED and GPIO resources
void led_release(void) {
    if (line) {
        gpiod_line_release(line);
        line = NULL;
    }
    if (chip) {
        gpiod_chip_close(chip);
        chip = NULL;
    }
    printf("LED resources released\n");
}