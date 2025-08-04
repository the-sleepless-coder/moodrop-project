// servo.h
// 서보 모터 제어 인터페이스

#ifndef SERVO_H
#define SERVO_H

// 서보 모터 ID 정의
typedef enum {
    SERVO_ROTATE, // 2단 플레이트 회전 제어 서보
    SERVO_VALVE   // 밸브 개폐 제어 서보
} ServoID;

// 제조 스텝 구조체
typedef struct {
    int position;           // 플레이트 위치 (0-11)
    int dispense_time_ms;   // 분사 시간 (밀리초)
} Step;

// 레시피 구조체
typedef struct {
    int id;                 // 레시피 ID
    const char* name;       // 레시피 이름
    int step_count;         // 스텝 개수
    Step steps[10];         // 최대 10개 스텝
} Recipe;

// 서보 모터 초기화
int servo_init();

// 밸브 서보 각도 설정
int servo_set_valve_angle(int angle);

// 플레이트 서보 각도 설정
int servo_set_plate_angle(int angle);

// 밸브 열기
int servo_open_valve();

// 밸브 닫기
int servo_close_valve();

// 플레이트를 특정 위치로 회전
int servo_rotate_plate_to_position(int position);

// 현재 밸브 각도 반환
int servo_get_valve_angle();

// 현재 플레이트 각도 반환
int servo_get_plate_angle();

// 서보 모터 정지
void servo_stop();

// 서보 모터 정리
void servo_cleanup();

// 레시피에 따른 서보 동작 실행
int servo_execute_recipe_step(const Step* step);

// 기존 호환성을 위한 함수들
void servo_set_angle(ServoID id, int angle);

#endif // SERVO_H
