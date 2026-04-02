package com.pidev.care.rabbitMQ;

import com.pidev.care.events.GenericEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class EventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public EventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendGenericEvent(GenericEvent event) {
        rabbitTemplate.convertAndSend(
                RabbitConfig.EXCHANGE,
                "doctor.patientList",
                event
        );
    }
}
