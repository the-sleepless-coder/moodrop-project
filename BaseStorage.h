// BaseStorage.h
// 베이스 스토리지 모듈 헤더 파일

#ifndef BASE_STORAGE_H
#define BASE_STORAGE_H

#include "servo.h"  // Recipe 구조체 정의

// 베이스 스토리지 초기화
int basestorage_init();

// 원료 추가
int add_material(const char* name, int max_amount, int current_amount, int min_threshold);

// 원료 용량 업데이트
int update_material_amount(const char* name, int new_amount, const char* reason);

// 원료 용량 확인
int get_material_amount(const char* name);

// 원료 사용 (용량 감소)
int use_material(const char* name, int amount);

// 원료 보충 (용량 증가)
int refill_material(const char* name, int amount);

// 제조 가능 여부 확인
int check_manufacturing_possibility(const Recipe* recipe);

// 제조 완료 후 원료 용량 갱신
int update_materials_after_manufacturing(const Recipe* recipe);

// 시스템 상태 정보 가져오기
void get_system_status(char* status_buffer);

// 모든 원료 정보 출력
void print_all_materials();

// 베이스 스토리지 정리
void basestorage_cleanup();

#endif // BASE_STORAGE_H 