// mqtt.c
// MQTT communication implementation using Mosquitto

#include "mqtt.h"
#include "storage.h"
#include "shared_globals.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <mosquitto.h>
#include <cjson/cJSON.h>

// --- 설정값 (본인의 환경에 맞게 수정하세요) ---
//#define MQTT_BROKER_ADDRESS   "localhost" //"192.168.137.231" // 예: "192.168.0.1"
#define MQTT_BROKER_ADDRESS   "70.12.245.101" //SSAFY_801
//#define MQTT_BROKER_ADDRESS   "192.168.137.228" //hotspot
#define MQTT_PORT             1883
//#define MQTT_CLIENT_ID        "raspi-perfume-device"
#define MQTT_CLIENT_ID        "jetson-nano-perfume-device"
#define MQTT_QOS              1
#define MQTT_SUB_TOPIC        "perfume/recipe"
#define MQTT_PUB_TOPIC        "perfume/feedback"
// -----------------------------------------

struct Hole g_perfume_recipe[MAX_RECIPE_STEPS]; 
volatile int g_start_manufacturing_flag;
int g_recipe_count = 0;

static struct mosquitto *mosq = NULL;

// ## 3. MQTT 콜백 함수 수정 ##
// =================================================================
// 이제 이 함수는 전역 변수에 데이터를 저장하고 깃발만 올리는 역할을 합니다.
void my_mqtt_callback(const char* topic, const char* payload) {
    (void)topic; // 미사용 매개변수 경고 제거
    printf("\n[MQTT] Message received! Parsing CMD...\n");

    cJSON *root = cJSON_Parse(payload);
    if (!root) {
        printf("JSON parsing error\n");
        return; 
    }

    cJSON *cmd_json = cJSON_GetObjectItem(root, "CMD");
    if (!cJSON_IsString(cmd_json)) { 
        cJSON_Delete(root); 
        return; 
    }

    char* cmd = cmd_json->valuestring;
    printf("[CMD] Received command: %s\n", cmd);

    if (strcmp(cmd, "manufacture") == 0) {
        g_recipe_count = 0;

        // 1. 향료 정보 처리 ("data" 배열 파싱)
        cJSON* data_array = cJSON_GetObjectItem(root, "data");
        if (cJSON_IsArray(data_array)) {
            cJSON* element = NULL;
            cJSON_ArrayForEach(element, data_array) {
                if (g_recipe_count >= MAX_RECIPE_STEPS) break;

                int slot_id = cJSON_GetObjectItem(element, "SlotId")->valueint;
                int received_prop = cJSON_GetObjectItem(element, "prop")->valueint;

                // 2ml 기준 비율을 10ml 기준 비율로 변환 (prop / 5)
                int calculated_prop = received_prop / 5;

                g_perfume_recipe[g_recipe_count].num = slot_id;
                g_perfume_recipe[g_recipe_count].prop = calculated_prop;
                printf("  - 향료 정보 저장: SlotId=%d, 수신비율=%d%% -> 변환비율=%d%%\n", slot_id, received_prop, calculated_prop);
                g_recipe_count++;
            }
        }

        // 2. 에탄올 정보 처리 ("ethanol" 객체 파싱)
        cJSON* ethanol_obj = cJSON_GetObjectItem(root, "ethanol");
        if (ethanol_obj && g_recipe_count < MAX_RECIPE_STEPS) {
            int ethanol_slot_id = cJSON_GetObjectItem(ethanol_obj, "SlotId")->valueint;
            g_perfume_recipe[g_recipe_count].num = ethanol_slot_id;
            g_perfume_recipe[g_recipe_count].prop = 30; // 에탄올 비율은 80%로 고정
            printf("  - 에탄올 정보 저장: SlotId=%d, 비율=80%%\n", ethanol_slot_id);
            g_recipe_count++;
        }
        g_start_manufacturing_flag = 1;

    }
    else if (strcmp(cmd, "update") == 0) {
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
        int success = set_base_storage(updates, count);

        // 성공/실패 여부에 따라 다른 메시지를 발행
        if (success) {
            mqtt_publish(MQTT_PUB_TOPIC, "{\"CMD\":\"check_response\", \"data\":{\"status\":\"complete\"}}");
        }
        else {
            mqtt_publish(MQTT_PUB_TOPIC, "{\"CMD\":\"check_response\", \"data\":{\"status\":\"error\"}}");
        }

    }
    else if (strcmp(cmd, "check") == 0) {
        struct Storage inventory[MAX_INVENTORY_ITEMS];
        int count = get_all_stock(inventory, MAX_BASE_INGREDIENTS);

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
    }
    else if (strcmp(cmd, "connect") == 0) {
        printf("[CMD] 연결 확인 응답 전송...\n");
        mqtt_publish(MQTT_PUB_TOPIC, "{\"CMD\":\"connect\"}");
    }
    
    cJSON_Delete(root);
}

// Mosquitto: 메시지 수신 시 호출될 콜백
void on_message_callback(struct mosquitto *mosq, void *userdata, const struct mosquitto_message *message) {
    (void)mosq;     // 미사용 매개변수 경고 제거
    (void)userdata; // 미사용 매개변수 경고 제거
    if (message->payloadlen) {
        printf("메시지 수신: Topic: %s, Payload: %s\n", message->topic, (char*)message->payload);
        // 내부 콜백 함수 호출
        my_mqtt_callback(message->topic, (char*)message->payload);
    }
}

// Mosquitto: 브로커 접속 성공 시 호출될 콜백
void on_connect_callback(struct mosquitto *mosq, void *userdata, int result) {
    (void)userdata; // 미사용 매개변수 경고 제거
    if (!result) {
        printf("MQTT 브로커에 성공적으로 연결되었습니다.\n");
        // 연결 성공 후 토픽 구독
        int rc = mosquitto_subscribe(mosq, NULL, MQTT_SUB_TOPIC, MQTT_QOS);
        if(rc != MOSQ_ERR_SUCCESS){
            fprintf(stderr, "오류: 토픽 구독에 실패했습니다: %s\n", mosquitto_strerror(rc));
        } else {
            printf("토픽 '%s'를 구독합니다.\n", MQTT_SUB_TOPIC);
        }
    } else {
        fprintf(stderr, "MQTT 브로커 연결 실패: %s\n", mosquitto_connack_string(result));
    }
}

// MQTT 초기화
void mqtt_init(void) {
    int rc;

    // 1. Mosquitto 라이브러리 초기화
    mosquitto_lib_init();

    // 2. Mosquitto 클라이언트 인스턴스 생성
    mosq = mosquitto_new(MQTT_CLIENT_ID, true, NULL);
    if (!mosq) {
        fprintf(stderr, "오류: Mosquitto 클라이언트 생성 실패\n");
        exit(EXIT_FAILURE);
    }

    // 3. 콜백 함수들 등록
    mosquitto_connect_callback_set(mosq, on_connect_callback);
    mosquitto_message_callback_set(mosq, on_message_callback);

    // 4. 브로커에 연결 (비동기)
    rc = mosquitto_connect(mosq, MQTT_BROKER_ADDRESS, MQTT_PORT, 60);
    if (rc != MOSQ_ERR_SUCCESS) {
        fprintf(stderr, "오류: 브로커에 연결할 수 없습니다: %s\n", mosquitto_strerror(rc));
        mosquitto_destroy(mosq);
        mosquitto_lib_cleanup();
        exit(EXIT_FAILURE);
    }

    // 5. 네트워크 통신을 위한 백그라운드 스레드 시작
    rc = mosquitto_loop_start(mosq);
    if (rc != MOSQ_ERR_SUCCESS) {
        fprintf(stderr, "오류: Mosquitto 루프 시작 실패: %s\n", mosquitto_strerror(rc));
        mosquitto_destroy(mosq);
        mosquitto_lib_cleanup();
        exit(EXIT_FAILURE);
    }
}

// MQTT 연결 종료
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
