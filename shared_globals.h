// shared_globals.h

#ifndef SHARED_GLOBALS_H
#define SHARED_GLOBALS_H

#include <stdbool.h>

// --- 공유 데이터 구조체 ---
// CMD: manufacture 에 사용
struct Hole {
    int num;
    int prop;
};

// CMD: update 에 사용
struct Storage {
    int num;
    int capacity;
};


// --- 상수 정의 ---
#define MAX_RECIPE_STEPS 20
#define MAX_INVENTORY_ITEMS 20

// --- 전역 변수 선언 (extern) ---
// 이 변수들의 실제 메모리 공간(정의)은 mqtt.c 파일에 있습니다.
// 다른 파일에서는 이 선언을 보고 "이런 변수가 어딘가에 있다"고 인지하고 사용합니다.
extern struct Hole g_perfume_recipe[MAX_RECIPE_STEPS];
extern int g_recipe_count;
extern volatile int g_start_manufacturing_flag;

#endif // SHARED_GLOBALS_H