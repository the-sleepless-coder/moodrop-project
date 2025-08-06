// servo.h

#ifndef SERVO_H
#define SERVO_H

#include "shared_globals.h" // 데이터 구조체를 사용하기 위해 include

/**
 * @brief 레시피에 따라 전체 제조 공정을 수행합니다.
 */
void manufacture_process(struct Hole recipe[], int count);

#endif // SERVO_H