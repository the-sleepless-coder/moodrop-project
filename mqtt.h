// mqtt.h

#ifndef MQTT_H
#define MQTT_H

// MQTT 모듈의 공개 인터페이스 함수들
void mqtt_init(void);
void mqtt_publish(const char* topic, const char* payload);
void mqtt_disconnect(void);

#endif // MQTT_H