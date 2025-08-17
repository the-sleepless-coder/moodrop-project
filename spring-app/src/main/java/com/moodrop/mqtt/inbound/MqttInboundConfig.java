package com.moodrop.mqtt.inbound;

import com.moodrop.config.MqttProperties;
import com.moodrop.mqtt.MqttService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

@Configuration
@RequiredArgsConstructor
public class MqttInboundConfig {

    private final MqttProperties props;
    private final MqttPahoClientFactory mqttClientFactory;

    @Bean
    public MessageChannel mqttInboundChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageProducer inbound() {
        var in = props.getIn();
        var adapter = new MqttPahoMessageDrivenChannelAdapter(
                in.getClientId(), mqttClientFactory, in.getTopic()
        );
        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(in.getQos());
        adapter.setOutputChannel(mqttInboundChannel());
        return adapter;
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public MessageHandler mqttInbound(MqttService mqttService) {
        return message -> onMqttMessage(message, mqttService);
    }

    private void onMqttMessage(Message<?> message, MqttService mqttService) {
        // 여기에 브레이크포인트
        String deviceId = "test1";
        Object payloadObj = message.getPayload();
        String payload = (payloadObj instanceof byte[])
                ? new String((byte[]) payloadObj, java.nio.charset.StandardCharsets.UTF_8)
                : String.valueOf(payloadObj);

        System.out.println("[MQTT IN]" + "payload=" + payload);

        mqttService.handleInbound(deviceId, payload);
    }
}
