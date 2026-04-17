package com.pidev.pharmacy.rabbitMQ;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public boolean sendGenericEvent(GenericEvent event, String routingKey) {
        if (event == null || event.getEventType() == null) {
            return false;
        }

        try {
            rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, routingKey, event);
            return true;
        } catch (AmqpException ex) {
            log.warn("RabbitMQ is unavailable, skipping event {} on routing key {}: {}",
                    event.getEventType(), routingKey, ex.getMessage());
            return false;
        } catch (RuntimeException ex) {
            log.warn("Unexpected error while publishing event {} on routing key {}: {}",
                    event.getEventType(), routingKey, ex.getMessage(), ex);
            return false;
        }
    }
}
