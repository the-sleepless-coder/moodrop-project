// led.c
// LED control implementation using libgpiod

#include "led.h"
#include "log.h"
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

// libgpiod resources
static struct gpiod_chip *chip = NULL;
static struct gpiod_line *line = NULL;
static unsigned int g_line_offset = 0;

// Initialize the LED and GPIO line
void led_init(const char *chip_name, unsigned int line_offset) {
    g_line_offset = line_offset;

    // Open the GPIO chip
    chip = gpiod_chip_open_by_name(chip_name);
    if (!chip) {
        perror("Failed to open GPIO chip\n");
        fprintf(stderr, "LED initialize failed. Exiting.\n");
        log_message("LED initialize failed");
        exit(EXIT_FAILURE);
    }

    // Get the GPIO line
    line = gpiod_chip_get_line(chip, g_line_offset);
    if (!line) {
        perror("Failed to get GPIO line\n");
        gpiod_chip_close(chip);
        chip = NULL;
        fprintf(stderr, "LED initialize failed. Exiting.\n");
        log_message("LED initialize failed");
        exit(EXIT_FAILURE);
    }

    // Request the line as an output
    if (gpiod_line_request_output(line, "led-control", 0) < 0) {
        perror("Failed to request line as output\n");
        gpiod_chip_close(chip);
        line = NULL;
        chip = NULL;
        fprintf(stderr, "LED initialize failed. Exiting.\n");
        log_message("LED initialize failed");
        exit(EXIT_FAILURE);
    }

    printf("LED initialized on %s, line %u\n", chip_name, line_offset);
    log_message("LED initialize succeeded");
}

// Turn the LED on
void led_on(void) {
    if (line) {
        for(int j=0;j<4;j++){
            for(int i=0;i<1000;i++){
                gpiod_line_set_value(line, 0);
                usleep(1000-i);
                gpiod_line_set_value(line, 1);
                usleep(i);
            }
            for(int i=0;i<1000;i++){
                gpiod_line_set_value(line, 1);
                usleep(1000-i);
                gpiod_line_set_value(line, 0);
                usleep(i);
            }
        }
        for(int i=0;i<1000;i++){
            gpiod_line_set_value(line, 0);
            usleep(1000-i);
            gpiod_line_set_value(line, 1);
            usleep(i);
        }
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