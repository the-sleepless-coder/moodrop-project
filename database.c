// database.c

#include "database.h"
#include <stdio.h>

bool db_check_stock(struct Hole recipe[], int count) {
    printf("[DB] %d개 항목에 대한 재고 확인 중...\n", count);
    // TODO: 실제 데이터베이스에서 재고를 확인하는 로직 구현
    // 이 예제에서는 항상 제조 가능하다고 가정합니다.
    return true; 
}

void db_update_stock(struct Storage updates[], int count) {
    printf("[DB] %d개 항목의 재고를 업데이트합니다...\n", count);
    for (int i=0; i < count; i++) {
        printf("   - %d번 향료, 새 용량: %d\n", updates[i].num, updates[i].capacity);
    }
    // TODO: 실제 데이터베이스의 재고 정보를 업데이트하는 로직 구현
}

int db_get_all_stock(struct Storage inventory[], int max_items) {
    printf("[DB] 전체 재고 정보를 가져옵니다...\n");
    // TODO: 실제 데이터베이스에서 모든 재고 정보를 읽어오는 로직 구현
    // 테스트를 위한 더미 데이터 반환
    inventory[0] = (struct Storage){.num = 1, .capacity = 100};
    inventory[1] = (struct Storage){.num = 5, .capacity = 80};
    inventory[2] = (struct Storage){.num = 8, .capacity = 120};
    return 3; // 3개의 항목을 찾았다고 가정
}