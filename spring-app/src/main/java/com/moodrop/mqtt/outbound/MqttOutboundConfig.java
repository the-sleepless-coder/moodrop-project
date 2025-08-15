package com.moodrop.mqtt.outbound;

import com.moodrop.config.MqttProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.PublishSubscribeChannel;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

@Configuration
@RequiredArgsConstructor
public class MqttOutboundConfig {

    private final MqttProperties props;
    private final MqttPahoClientFactory mqttClientFactory;

    @Bean
    public MessageChannel mqttOutboundChannel() {
        return new PublishSubscribeChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MessageHandler mqttOutbound() {
        var out = props.getOut();
        var h = new MqttPahoMessageHandler(out.getClientId(), mqttClientFactory);
        h.setDefaultTopic(out.getTopic());
        h.setDefaultQos(out.getQos());
        h.setAsync(true);
        h.setAsyncEvents(true);
        return h;
    }
}
