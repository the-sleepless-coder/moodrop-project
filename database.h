// database.h

#ifndef DATABASE_H
#define DATABASE_H

#include "shared_globals.h" // 데이터 구조체를 사용하기 위해 include

/**
 * @brief 레시피에 필요한 향료들의 재고가 충분한지 확인합니다.
 * @return 제조 가능하면 true, 불가능하면 false.
 */
bool db_check_stock(struct Hole recipe[], int count);

/**
 * @brief 향료 재고 정보를 업데이트합니다.
 */
void db_update_stock(struct Storage updates[], int count);

/**
 * @brief DB에 저장된 모든 향료의 재고 정보를 가져옵니다.
 * @param inventory 재고 정보를 저장할 배열.
 * @param max_items 배열의 최대 크기.
 * @return 가져온 재고 항목의 개수.
 */
int db_get_all_stock(struct Storage inventory[], int max_items);

#endif // DATABASE_H