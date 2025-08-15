package com.moodrop.config;

import com.moodrop.config.MqttProperties;
import lombok.RequiredArgsConstructor;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;

@Configuration
@RequiredArgsConstructor
public class MqttCommonConfig {
    private final MqttProperties props;

    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        var opts = new MqttConnectOptions();
        opts.setServerURIs(new String[]{ props.getUrl() }); // String → 배열로 감싸서 전달
        opts.setCleanSession(false);
        opts.setAutomaticReconnect(true);
        opts.setKeepAliveInterval(60);
        opts.setConnectionTimeout(10);

        var factory = new DefaultMqttPahoClientFactory();
        factory.setConnectionOptions(opts);
        return factory;
    }
}
