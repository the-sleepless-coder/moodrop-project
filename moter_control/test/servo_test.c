#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <linux/i2c-dev.h>
#include <sys/ioctl.h>
#include <stdint.h>
#include <time.h>

#define I2C_DEV "/dev/i2c-1"
#define PCA9685_ADDR 0x60
#define MODE1 0x00
#define PRESCALE 0xFE

// PCA9685 각 채널 base address
#define LED0_ON_L  0x06

// 서보용 PWM 값 (데이터시트 참고)
#define SERVOMIN 150  // 0도
#define SERVOMAX 600  // 180도

void msleep(int ms) {
    struct timespec req = {ms/1000, (ms%1000)*1000000};
    nanosleep(&req, NULL);
}

void pca9685_write(int fd, uint8_t reg, uint8_t value) {
    uint8_t buf[2] = {reg, value};
    if (write(fd, buf, 2) != 2)
        perror("I2C Write error");
}

// 최대 4096 (12bit)의 PWM steps
void set_pwm(int fd, uint8_t channel, uint16_t on, uint16_t off) {
    uint8_t reg = LED0_ON_L + 4 * channel;
    uint8_t buf[5] = {reg, on & 0xFF, on >> 8, off & 0xFF, off >> 8};
    if (write(fd, buf, 5) != 5)
        perror("I2C PWM set error");
}

// 각도를 Pulse(0~4095)로 변환
uint16_t angle_to_pulse(int angle) {
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;
    return SERVOMIN + (angle * (SERVOMAX - SERVOMIN) / 180);
}

void pca9685_init(int fd) {
    // MODE1 register - sleep enable
    pca9685_write(fd, MODE1, 0x10);

    // PWM Frequency 50Hz for servo: prescale = round(25MHz/(4096*50)) - 1 = 121
    pca9685_write(fd, PRESCALE, 121);

    // MODE1 register - restart
    pca9685_write(fd, MODE1, 0xA1);
}

int main() {
    int fd = open(I2C_DEV, O_RDWR);
    if (fd < 0) {
        perror("I2C open fail");
        return 1;
    }
    if (ioctl(fd, I2C_SLAVE, PCA9685_ADDR) < 0) {
        perror("I2C address set fail");
        close(fd);
        return 1;
    }

    printf("PCA9685 initializing at 0x60...\n");
    pca9685_init(fd);
    printf("Servo 0 will be set to 180 deg (center)...\n");
    set_pwm(fd, 0, 0, angle_to_pulse(180));
    printf("초기 각도가 바퀴 방향의 중앙 설정되었다면 enter키를 눌러주세요\n");
    getchar();

    printf("서보모터 test - 0도부터 180도까지 5도 단위로 이동합니다.\n");
    for (int angle = 0; angle <= 180; angle += 5) {
        set_pwm(fd, 0, 0, angle_to_pulse(angle));
        printf("Servo 0 angle: %d\n", angle);
        msleep(100);
    }
    for (int angle = 180; angle >= 0; angle -= 5) {
        set_pwm(fd, 0, 0, angle_to_pulse(angle));
        printf("Servo 0 angle: %d\n", angle);
        msleep(100);
    }
    printf("Servo control test completed.\n");
    close(fd);
    return 0;
}

