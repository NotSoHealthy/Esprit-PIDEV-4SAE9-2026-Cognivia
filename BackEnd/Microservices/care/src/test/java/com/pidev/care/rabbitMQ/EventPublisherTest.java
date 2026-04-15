package com.pidev.care.rabbitMQ;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.pidev.care.events.GenericEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@ExtendWith(MockitoExtension.class)
class EventPublisherTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    private EventPublisher publisher;

    @BeforeEach
    void setUp() {
        publisher = new EventPublisher(rabbitTemplate);
    }

    @Test
    void sendGenericEvent_sendsWhenEventTypePresent() {
        GenericEvent event = new GenericEvent("visit.created", null);

        publisher.sendGenericEvent(event, "care.visit");

        verify(rabbitTemplate).convertAndSend(RabbitConfig.EXCHANGE, "care.visit", event);
    }

    @Test
    void sendGenericEvent_doesNothingWhenEventNull() {
        publisher.sendGenericEvent(null, "rk");
        verifyNoInteractions(rabbitTemplate);
    }

    @Test
    void sendGenericEvent_doesNothingWhenEventTypeNull() {
        GenericEvent event = new GenericEvent(null, null);
        publisher.sendGenericEvent(event, "rk");
        verifyNoInteractions(rabbitTemplate);
    }
}
