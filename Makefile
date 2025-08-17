# 컴파일러 및 플래그 설정
CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -D_POSIX_C_SOURCE=200809L
LDFLAGS = -lmosquitto -lcjson -lm -lgpiod

# 타겟 실행 파일명
TARGET = test

# 소스 파일들
SRCS = main.c mqtt.c servo_sync.c servo.c valve.c led.c storage.c log.c
OBJS = $(SRCS:.c=.o)

# 기본 타겟
all: $(TARGET)

# 실행 파일 생성
$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $(TARGET) $(LDFLAGS)
	rm -f $(OBJS)

# 오브젝트 파일 생성
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# 의존성 규칙
main.o: main.c mqtt.h servo.h valve.h led.h log.h
mqtt.o: mqtt.c mqtt.h log.h
servo.o: servo.c servo.h valve.h mqtt.h log.h
valve.o: valve.c valve.h mqtt.h log.h
led.o: led.c led.h log.h

# 정리
clean:
	rm -f $(OBJS) $(TARGET)

# 재빌드
rebuild: clean all

# 설치 (필요한 라이브러리 설치)
install:
	sudo apt-get update
	sudo apt-get install -y libmosquitto-dev libcjson-dev libgpiod-dev

.PHONY: all clean rebuild install 