package com.moodrop.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "mqtt")
public class MqttProperties {
    private String url;

    private Out out = new Out();
    private In in = new In();

    @Data public static class Out {
        private String clientId;
        private String topic;
        private Integer qos;
    }
    @Data public static class In {
        private String clientId;
        private String topic;
        private Integer qos;
    }
}
