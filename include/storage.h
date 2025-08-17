// basestorage.h
// Perfume base ingredient storage management

#ifndef STORAGE_H
#define STORAGE_H

#include "shared_globals.h"

#define MAX_BASE_INGREDIENTS 12 // 관리할 최대 베이스 원료 종류 수
#define BASE_STORAGE_FILE "../base_storage.txt"

/**
 * @brief 텍스트 파일에서 원료량 정보를 읽어들여 초기화합니다.
 * 파일이 없으면 기본값으로 새로 생성합니다.
 * @return 성공 시 0, 실패 시 -1을 반환합니다.
 */
void load_base_storage();

/**
 * @brief 제조에 필요한 원료가 충분한지 확인합니다.
 * @param recipe 제조할 향수 레시피 배열
 * @param recipe_count 레시피에 포함된 원료의 수
 * @return 모든 원료가 충분하면 1, 부족하면 0을 반환합니다.
 */
int check_base_stock(struct Hole recipe[], int recipe_count);

/**
 * @brief 제조 완료 후, 사용된 원료량을 차감하고 파일에 갱신합니다.
 * @param recipe 사용된 향수 레시피 배열
 * @param recipe_count 레시피에 포함된 원료의 수
 */
void update_base_storage(struct Hole recipe[], int recipe_count);

/**
 * @brief MQTT를 통해 특정 원료의 양을 수동으로 업데이트합니다.
 * @param base_id 업데이트할 원료의 ID
 * @param new_capacity 새로운 원료량 (ml)
 */
int set_base_storage(const struct Storage updates[], int new_capacity);

/**
 * @brief 현재 저장된 모든 재고 정보를 배열에 복사합니다.
 * @param stock_out 재고 정보를 복사받을 배열
 * @param max_items 배열의 최대 크기
 * @return 복사된 아이템의 수
 */
 int get_all_stock(struct Storage stock_out[], int max_items);

#endif // BASESTORAGE_H