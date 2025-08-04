// BaseStorage.c
// 베이스 스토리지 모듈 - 원료 용량 관리 및 제조 가능 여부 확인

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "BaseStorage.h"
#include "log.h"

// 원료 정보 구조체
typedef struct {
    char name[64];
    int current_amount;    // 현재 용량 (ml)
    int max_amount;        // 최대 용량 (ml)
    int min_threshold;     // 최소 임계값 (ml)
    int last_updated;      // 마지막 업데이트 시간
} Material;

// 원료 데이터베이스
#define MAX_MATERIALS 20
static Material materials[MAX_MATERIALS];
static int material_count = 0;
static int storage_initialized = 0;

// 기본 원료 초기화
void initialize_default_materials() {
    // 향수 제조에 필요한 기본 원료들
    add_material("베이스_오일", 1000, 1000, 100);
    add_material("알코올", 2000, 2000, 200);
    add_material("에센셜_오일_라벤더", 500, 500, 50);
    add_material("에센셜_오일_로즈", 500, 500, 50);
    add_material("에센셜_오일_자스민", 500, 500, 50);
    add_material("에센셜_오일_바닐라", 500, 500, 50);
    add_material("에센셜_오일_시트러스", 500, 500, 50);
    add_material("에센셜_오일_우드", 500, 500, 50);
}

// 베이스 스토리지 초기화
int basestorage_init() {
    if (storage_initialized) {
        return 0;
    }
    
    // 원료 배열 초기화
    memset(materials, 0, sizeof(materials));
    material_count = 0;
    
    // 기본 원료 추가
    initialize_default_materials();
    
    storage_initialized = 1;
    
    // 로그 기록
    log_write(LOG_MAINTENANCE, "베이스 스토리지 초기화 완료 - 원료 수: %d", material_count);
    
    return 0;
}

// 원료 추가
int add_material(const char* name, int max_amount, int current_amount, int min_threshold) {
    if (!storage_initialized) {
        log_write(LOG_ERROR, "베이스 스토리지가 초기화되지 않음");
        return -1;
    }
    
    if (material_count >= MAX_MATERIALS) {
        log_write(LOG_ERROR, "원료 최대 개수 초과");
        return -1;
    }
    
    // 중복 확인
    for (int i = 0; i < material_count; i++) {
        if (strcmp(materials[i].name, name) == 0) {
            log_write(LOG_ERROR, "원료 중복: %s", name);
            return -1;
        }
    }
    
    // 새 원료 추가
    strcpy(materials[material_count].name, name);
    materials[material_count].max_amount = max_amount;
    materials[material_count].current_amount = current_amount;
    materials[material_count].min_threshold = min_threshold;
    materials[material_count].last_updated = (int)time(NULL);
    
    material_count++;
    
    log_write(LOG_MAINTENANCE, "원료 추가 - %s: 최대 %dml, 현재 %dml, 임계값 %dml", 
              name, max_amount, current_amount, min_threshold);
    
    return material_count - 1;  // 추가된 원료의 인덱스 반환
}

// 원료 용량 업데이트
int update_material_amount(const char* name, int new_amount, const char* reason) {
    if (!storage_initialized) {
        log_write(LOG_ERROR, "베이스 스토리지가 초기화되지 않음");
        return -1;
    }
    
    for (int i = 0; i < material_count; i++) {
        if (strcmp(materials[i].name, name) == 0) {
            int old_amount = materials[i].current_amount;
            materials[i].current_amount = new_amount;
            materials[i].last_updated = (int)time(NULL);
            
            // 용량 제한 확인
            if (new_amount > materials[i].max_amount) {
                materials[i].current_amount = materials[i].max_amount;
                log_write(LOG_MAINTENANCE, "원료 용량 초과 - %s: %dml로 제한", 
                          name, materials[i].max_amount);
            }
            
            // 로그 기록
            log_material_update(name, old_amount, materials[i].current_amount, reason);
            
            return 0;
        }
    }
    
    log_write(LOG_ERROR, "원료를 찾을 수 없음: %s", name);
    return -1;
}

// 원료 용량 확인
int get_material_amount(const char* name) {
    if (!storage_initialized) {
        return -1;
    }
    
    for (int i = 0; i < material_count; i++) {
        if (strcmp(materials[i].name, name) == 0) {
            return materials[i].current_amount;
        }
    }
    
    return -1;  // 원료를 찾을 수 없음
}

// 원료 사용 (용량 감소)
int use_material(const char* name, int amount) {
    if (!storage_initialized) {
        log_write(LOG_ERROR, "베이스 스토리지가 초기화되지 않음");
        return -1;
    }
    
    for (int i = 0; i < material_count; i++) {
        if (strcmp(materials[i].name, name) == 0) {
            if (materials[i].current_amount < amount) {
                log_write(LOG_MAINTENANCE, "원료 부족 - %s: 필요 %dml, 보유 %dml", 
                          name, amount, materials[i].current_amount);
                return -1;
            }
            
            int old_amount = materials[i].current_amount;
            materials[i].current_amount -= amount;
            materials[i].last_updated = (int)time(NULL);
            
            // 로그 기록
            log_material_update(name, old_amount, materials[i].current_amount, "사용");
            
            // 임계값 확인
            if (materials[i].current_amount <= materials[i].min_threshold) {
                log_write(LOG_MAINTENANCE, "원료 임계값 경고 - %s: %dml (임계값: %dml)", 
                          name, materials[i].current_amount, materials[i].min_threshold);
            }
            
            return 0;
        }
    }
    
    log_write(LOG_ERROR, "원료를 찾을 수 없음: %s", name);
    return -1;
}

// 원료 보충 (용량 증가)
int refill_material(const char* name, int amount) {
    if (!storage_initialized) {
        log_write(LOG_ERROR, "베이스 스토리지가 초기화되지 않음");
        return -1;
    }
    
    for (int i = 0; i < material_count; i++) {
        if (strcmp(materials[i].name, name) == 0) {
            int old_amount = materials[i].current_amount;
            materials[i].current_amount += amount;
            materials[i].last_updated = (int)time(NULL);
            
            // 최대 용량 제한
            if (materials[i].current_amount > materials[i].max_amount) {
                materials[i].current_amount = materials[i].max_amount;
            }
            
            // 로그 기록
            log_material_update(name, old_amount, materials[i].current_amount, "보충");
            
            return 0;
        }
    }
    
    log_write(LOG_ERROR, "원료를 찾을 수 없음: %s", name);
    return -1;
}

// 제조 가능 여부 확인
int check_manufacturing_possibility(const Recipe* recipe) {
    if (!storage_initialized || !recipe) {
        return 0;
    }
    
    // 레시피의 각 스텝에 필요한 원료 확인
    for (int i = 0; i < recipe->step_count; i++) {
        Step step = recipe->steps[i];
        
        // 각 스텝에서 사용할 원료 확인 (실제로는 레시피에 원료 정보가 포함되어야 함)
        // 여기서는 간단한 예시로 기본 원료들만 확인
        
        // 베이스 오일 확인
        if (get_material_amount("베이스_오일") < 50) {
            log_manufacturing_possibility(recipe->name, 0, "베이스 오일 부족");
            return 0;
        }
        
        // 알코올 확인
        if (get_material_amount("알코올") < 100) {
            log_manufacturing_possibility(recipe->name, 0, "알코올 부족");
            return 0;
        }
        
        // 에센셜 오일 확인 (위치에 따라 다른 오일 사용)
        char oil_name[64];
        switch (step.position % 5) {
            case 0:
                strcpy(oil_name, "에센셜_오일_라벤더");
                break;
            case 1:
                strcpy(oil_name, "에센셜_오일_로즈");
                break;
            case 2:
                strcpy(oil_name, "에센셜_오일_자스민");
                break;
            case 3:
                strcpy(oil_name, "에센셜_오일_바닐라");
                break;
            case 4:
                strcpy(oil_name, "에센셜_오일_시트러스");
                break;
            default:
                strcpy(oil_name, "에센셜_오일_우드");
                break;
        }
        
        if (get_material_amount(oil_name) < 10) {
            log_manufacturing_possibility(recipe->name, 0, "에센셜 오일 부족");
            return 0;
        }
    }
    
    log_manufacturing_possibility(recipe->name, 1, "모든 원료 충분");
    return 1;
}

// 제조 완료 후 원료 용량 갱신
int update_materials_after_manufacturing(const Recipe* recipe) {
    if (!storage_initialized || !recipe) {
        return -1;
    }
    
    // 레시피의 각 스텝에 따라 원료 사용
    for (int i = 0; i < recipe->step_count; i++) {
        Step step = recipe->steps[i];
        
        // 베이스 오일 사용 (각 스텝마다 10ml)
        if (use_material("베이스_오일", 10) != 0) {
            log_write(LOG_ERROR, "베이스 오일 사용 실패");
            return -1;
        }
        
        // 알코올 사용 (각 스텝마다 20ml)
        if (use_material("알코올", 20) != 0) {
            log_write(LOG_ERROR, "알코올 사용 실패");
            return -1;
        }
        
        // 에센셜 오일 사용 (각 스텝마다 2ml)
        char oil_name[64];
        switch (step.position % 5) {
            case 0:
                strcpy(oil_name, "에센셜_오일_라벤더");
                break;
            case 1:
                strcpy(oil_name, "에센셜_오일_로즈");
                break;
            case 2:
                strcpy(oil_name, "에센셜_오일_자스민");
                break;
            case 3:
                strcpy(oil_name, "에센셜_오일_바닐라");
                break;
            case 4:
                strcpy(oil_name, "에센셜_오일_시트러스");
                break;
            default:
                strcpy(oil_name, "에센셜_오일_우드");
                break;
        }
        
        if (use_material(oil_name, 2) != 0) {
            log_write(LOG_ERROR, "에센셜 오일 사용 실패: %s", oil_name);
            return -1;
        }
    }
    
    log_write(LOG_MANUFACTURING, "제조 완료 후 원료 용량 갱신 완료 - 레시피: %s", recipe->name);
    return 0;
}

// 시스템 상태 정보 가져오기
void get_system_status(char* status_buffer) {
    if (!storage_initialized) {
        strcpy(status_buffer, "베이스 스토리지 미초기화");
        return;
    }
    
    char temp_buffer[1024];
    strcpy(status_buffer, "원료 상태:\n");
    
    for (int i = 0; i < material_count; i++) {
        snprintf(temp_buffer, sizeof(temp_buffer), 
                "%s: %d/%dml (임계값: %dml)\n", 
                materials[i].name, 
                materials[i].current_amount, 
                materials[i].max_amount, 
                materials[i].min_threshold);
        strcat(status_buffer, temp_buffer);
    }
}

// 모든 원료 정보 출력
void print_all_materials() {
    if (!storage_initialized) {
        printf("베이스 스토리지가 초기화되지 않음\n");
        return;
    }
    
    printf("\n=== 원료 현황 ===\n");
    printf("%-20s %-10s %-10s %-10s\n", "원료명", "현재용량", "최대용량", "임계값");
    printf("------------------------------------------------\n");
    
    for (int i = 0; i < material_count; i++) {
        printf("%-20s %-10d %-10d %-10d\n", 
               materials[i].name, 
               materials[i].current_amount, 
               materials[i].max_amount, 
               materials[i].min_threshold);
    }
    printf("\n");
}

// 베이스 스토리지 정리
void basestorage_cleanup() {
    if (!storage_initialized) {
        return;
    }
    
    log_write(LOG_MAINTENANCE, "베이스 스토리지 정리 완료");
    storage_initialized = 0;
} 