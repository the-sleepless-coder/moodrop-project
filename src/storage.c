// basestorage.c
// Implementation of base ingredient storage management

#include "storage.h"
#include "shared_globals.h"
#include "log.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h> // for strcmp
#include <cjson/cJSON.h>

// 전역 변수로 현재 원료 재고 상태를 저장
static struct Storage g_base_stock[MAX_BASE_INGREDIENTS];

// 내부에서만 사용할 함수 (파일 쓰기)
static void _write_storage_to_file() {
    FILE *file = fopen(BASE_STORAGE_FILE, "w");
    if (file == NULL) {
        perror("Error opening base storage file for writing");
        return;
    }

    for (int i = 0; i < MAX_BASE_INGREDIENTS; ++i) {
        fprintf(file, "%d %d\n", g_base_stock[i].num, g_base_stock[i].capacity);
    }

    fclose(file);
}

void load_base_storage() {
    FILE *file = fopen(BASE_STORAGE_FILE, "r");
    if (file == NULL) {
        printf("Base storage file not found. Creating a new one with default values.\n");
        // 파일이 없으면 기본값으로 초기화 (모든 원료 500ml)
        for (int i = 0; i < MAX_BASE_INGREDIENTS; ++i) {
            g_base_stock[i].num = i + 1;
            g_base_stock[i].capacity = 500; // 기본값 500ml
        }
        _write_storage_to_file();
        log_message("Base storage initialize succeeded");
        return;
    }

    for (int i = 0; i < MAX_BASE_INGREDIENTS; ++i) {
        if (fscanf(file, "%d %d", &g_base_stock[i].num, &g_base_stock[i].capacity) != 2) {
            fprintf(stderr, "Error reading base storage file. Check file format.\n");
            fclose(file);
            fprintf(stderr, "Base storage initialize failed. Exiting.\n");
        log_message("Base storage initialize failed");
            exit(EXIT_FAILURE);
        }
    }

    printf("Base storage loaded successfully.\n");
    log_message("Base storage loaded successfully");
    fclose(file);
    return;
}

int check_base_stock(struct Hole recipe[], int recipe_count) {
    for (int i = 0; i < recipe_count; ++i) {
        int required_id = recipe[i].num;
        int required_capacity = recipe[i].prop; // 레시피의 prop을 사용할 양(ml)으로 가정

        if (required_id > 0 && required_id <= MAX_BASE_INGREDIENTS) {
            // g_base_stock 배열에서 해당 ID를 가진 원료를 찾음 (id는 1부터 시작)
            if (g_base_stock[required_id - 1].capacity < required_capacity) {
                fprintf(stderr, "Error: Insufficient stock for base ID %d. Required: %d ml, Available: %d ml\n",
                        required_id, required_capacity, g_base_stock[required_id - 1].capacity);
                return 0; // 재고 부족
            }
        } else {
            fprintf(stderr, "Error: Invalid base ID %d in recipe.\n", required_id);
            return 0; // 잘못된 ID
        }
    }
    return 1; // 모든 재료 재고 충분
}

void update_base_storage(struct Hole recipe[], int recipe_count) {
    printf("Updating base storage...\n");
    for (int i = 0; i < recipe_count; ++i) {
        int used_id = recipe[i].num;
        int used_capacity = recipe[i].prop;

        if (used_id > 0 && used_id <= MAX_BASE_INGREDIENTS) {
            g_base_stock[used_id - 1].capacity -= used_capacity;
            printf("  - Base ID %d: %d ml used. Remaining: %d ml\n",
                   used_id, used_capacity, g_base_stock[used_id - 1].capacity);
        }
    }

    _write_storage_to_file();
    printf("Base storage file updated.\n");
}

int set_base_storage(const struct Storage updates[], int count) {
    printf("Setting base storage with new values...\n");
    int all_updates_valid = 1;
    
    for (int i = 0; i < count; i++) {
        int id_to_update = updates[i].num;
        int new_capacity = updates[i].capacity;

        if (id_to_update > 0 && id_to_update <= MAX_BASE_INGREDIENTS) {
            g_base_stock[id_to_update - 1].capacity = new_capacity;
            printf("  - Base ID %d has been updated to %d ml.\n", id_to_update, new_capacity);
        } else {
            fprintf(stderr, "Failed to set base capacity: Invalid ID %d\n", id_to_update);
            all_updates_valid = 0;
        }
    }
    _write_storage_to_file();
    printf("Base storage file updated after setting new values.\n");
    return all_updates_valid;
}

int get_all_stock(struct Storage stock_out[], int max_items) {
    int items_to_copy = (max_items < MAX_BASE_INGREDIENTS) ? max_items : MAX_BASE_INGREDIENTS;
    for (int i = 0; i < items_to_copy; ++i) {
        stock_out[i] = g_base_stock[i];
    }
    return items_to_copy;
}