# Makefile for 향수 제조 로봇 프로젝트

# 컴파일러 설정
CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g
LDFLAGS = -lpthread

# 소스 파일들
SOURCES = main.c MQTT.c servo.c log.c LED.c BaseStorage.c
OBJECTS = $(SOURCES:.c=.o)

# 실행 파일 이름
TARGET = perfume_robot

# 기본 타겟
all: $(TARGET)

# 실행 파일 생성
$(TARGET): $(OBJECTS)
	$(CC) $(OBJECTS) -o $(TARGET) $(LDFLAGS)
	@echo "컴파일 완료: $(TARGET)"

# 오브젝트 파일 생성
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# 정리
clean:
	rm -f $(OBJECTS) $(TARGET)
	@echo "정리 완료"

# 실행
run: $(TARGET)
	./$(TARGET)

# 디버그 모드
debug: CFLAGS += -DDEBUG
debug: $(TARGET)

# 릴리즈 모드
release: CFLAGS += -O2 -DNDEBUG
release: $(TARGET)

# 의존성 정보
main.o: main.c MQTT.h servo.h log.h LED.h BaseStorage.h
MQTT.o: MQTT.c MQTT.h servo.h log.h BaseStorage.h
servo.o: servo.c servo.h log.h LED.h
log.o: log.c log.h
LED.o: LED.c LED.h log.h
BaseStorage.o: BaseStorage.c BaseStorage.h log.h servo.h

# 도움말
help:
	@echo "사용 가능한 타겟:"
	@echo "  all      - 프로젝트 빌드 (기본)"
	@echo "  clean    - 빌드 파일 정리"
	@echo "  run      - 프로그램 실행"
	@echo "  debug    - 디버그 모드로 빌드"
	@echo "  release  - 릴리즈 모드로 빌드"
	@echo "  help     - 이 도움말 표시"

.PHONY: all clean run debug release help 