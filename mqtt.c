// mqtt.c

#include "mqtt.h"
#include "shared_globals.h"
#include "database.h"
#include <cjson/cJSON.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <mosquitto.h>

// --- MQTT 설정 ---
#define MQTT_BROKER_ADDRESS   "70.12.245.101"
#define MQTT_PORT             1883
#define MQTT_CLIENT_ID        "jetson-nano-perfume-device"
#define MQTT_SUB_TOPIC        "perfume/recipe"
#define MQTT_PUB_TOPIC        "perfume/feedback"
#define MQTT_QOS              1

// === 전역 변수 실제 정의 ===
struct Hole g_perfume_recipe[MAX_RECIPE_STEPS];
int g_recipe_count = 0;
volatile int g_start_manufacturing_flag = 0;

// --- MQTT 내부 변수 ---
static struct mosquitto *mosq = NULL;

// --- 내부 메시지 처리 함수 ---
static void _mqtt_message_handler(const char* payload) {
    printf("\n[MQTT] 메시지 수신! CMD 분석 시작...\n");

    cJSON *root = cJSON_Parse(payload);
    if (!root) { printf("JSON 파싱 오류\n"); return; }

    cJSON *cmd_json = cJSON_GetObjectItem(root, "CMD");
    if (!cJSON_IsString(cmd_json)) { cJSON_Delete(root); return; }
    
    char* cmd = cmd_json->valuestring;
    printf("[CMD] 수신된 명령어: %s\n", cmd);

    if (strcmp(cmd, "manufacture") == 0) {
        cJSON* data = cJSON_GetObjectItem(root, "data");
        g_recipe_count = 0;
        if (cJSON_IsArray(data)) {
            cJSON* element = NULL;
            cJSON_ArrayForEach(element, data) {
                if (g_recipe_count >= MAX_RECIPE_STEPS) break;
                g_perfume_recipe[g_recipe_count].num = cJSON_GetObjectItem(element, "SlotId")->valueint;
                g_perfume_recipe[g_recipe_count].prop = cJSON_GetObjectItem(element, "prop")->valueint;
                g_recipe_count++;
            }
        }
        
        if (db_check_stock(g_perfume_recipe, g_recipe_count)) {
            mqtt_publish(MQTT_PUB_TOPIC, "{\"CMD\":\"status\", \"data\":{\"status\":\"possible\"}}");
            g_start_manufacturing_flag = 1;
        } else {
            mqtt_publish(MQTT_PUB_TOPIC, "{\"CMD\":\"status\", \"data\":{\"status\":\"impossible\"}}");
        }

    } else if (strcmp(cmd, "update") == 0) {
        struct Storage updates[MAX_INVENTORY_ITEMS];
        int count = 0;
        cJSON* data = cJSON_GetObjectItem(root, "data");
        if (cJSON_IsArray(data)) {
            cJSON* element = NULL;
             cJSON_ArrayForEach(element, data) {
                if (count >= MAX_INVENTORY_ITEMS) break;
                updates[count].num = cJSON_GetObjectItem(element, "SlotId")->valueint;
                updates[count].capacity = cJSON_GetObjectItem(element, "capacity")->valueint;
                count++;
            }
        }
        db_update_stock(updates, count);
        mqtt_publish(MQTT_PUB_TOPIC, "{\"CMD\":\"update\", \"data\":{\"status\":\"complete\"}}");
        printf("\n[MAIN] 작업 완료. 다시 대기 상태로 전환합니다.\n");

    } else if (strcmp(cmd, "check") == 0) {
        struct Storage inventory[MAX_INVENTORY_ITEMS];
        int count = db_get_all_stock(inventory, MAX_INVENTORY_ITEMS);

        cJSON *resp_root = cJSON_CreateObject();
        cJSON_AddStringToObject(resp_root, "CMD", "check");
        cJSON *data_array = cJSON_CreateArray();
        for(int i=0; i<count; i++) {
            cJSON *item = cJSON_CreateObject();
            cJSON_AddNumberToObject(item, "SlotId", inventory[i].num);
            cJSON_AddNumberToObject(item, "capacity", inventory[i].capacity);
            cJSON_AddItemToArray(data_array, item);
        }
        cJSON_AddItemToObject(resp_root, "data", data_array);

        char *resp_payload = cJSON_PrintUnformatted(resp_root);
        mqtt_publish(MQTT_PUB_TOPIC, resp_payload);

        cJSON_free(resp_payload);
        cJSON_Delete(resp_root);
        printf("\n[MAIN] 작업 완료. 다시 대기 상태로 전환합니다.\n");
    }
    else if (strcmp(cmd, "connect") == 0) {
        printf("[CMD] 연결 확인 응답 전송...\n");
        mqtt_publish(MQTT_PUB_TOPIC, "{\"CMD\":\"connect\"}");
        printf("\n[MAIN] 작업 완료. 다시 대기 상태로 전환합니다.\n");
    }
    
    cJSON_Delete(root);
}

// --- MQTT 라이브러리 콜백 및 공개 함수들 ---
// (이 아래 부분은 변경사항 없습니다)

static void on_message_callback(struct mosquitto *mosq, void *userdata, const struct mosquitto_message *message) {
    if (message->payloadlen) {
        _mqtt_message_handler((char*)message->payload);
    }
}

static void on_connect_callback(struct mosquitto *mosq, void *userdata, int result) {
    if (!result) {
        printf("MQTT 브로커에 성공적으로 연결되었습니다.\n");
        mosquitto_subscribe(mosq, NULL, MQTT_SUB_TOPIC, MQTT_QOS);
    } else {
        fprintf(stderr, "MQTT 브로커 연결 실패: %s\n", mosquitto_connack_string(result));
    }
}

void mqtt_init(void) {
    mosquitto_lib_init();
    mosq = mosquitto_new(MQTT_CLIENT_ID, true, NULL);
    if (!mosq) { exit(EXIT_FAILURE); }

    mosquitto_connect_callback_set(mosq, on_connect_callback);
    mosquitto_message_callback_set(mosq, on_message_callback);

    if (mosquitto_connect(mosq, MQTT_BROKER_ADDRESS, MQTT_PORT, 60) != MOSQ_ERR_SUCCESS) {
        exit(EXIT_FAILURE);
    }
    if (mosquitto_loop_start(mosq) != MOSQ_ERR_SUCCESS) {
        exit(EXIT_FAILURE);
    }
}

void mqtt_disconnect(void) {
    mosquitto_loop_stop(mosq, true);
    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    printf("MQTT 연결이 종료되었습니다.\n");
}

void mqtt_publish(const char* topic, const char* payload) {
    if (!mosq) return;
    int rc = mosquitto_publish(mosq, NULL, topic, strlen(payload), payload, MQTT_QOS, false);
    if (rc != MOSQ_ERR_SUCCESS) {
        fprintf(stderr, "MQTT 발행 실패: %s\n", mosquitto_strerror(rc));
    } else {
        printf("[MQTT] 발행 성공 -> Topic: %s, Payload: %s\n", topic, payload);
    }
}