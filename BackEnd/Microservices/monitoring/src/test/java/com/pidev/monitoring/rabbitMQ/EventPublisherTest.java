package com.pidev.monitoring.rabbitMQ;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.pidev.monitoring.events.GenericEvent;
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
    void sendGenericEvent_sendsWhenEventAndRoutingKeyPresent() {
        GenericEvent event = new GenericEvent("type", null, null);

        publisher.sendGenericEvent(event, "rk");

        verify(rabbitTemplate).convertAndSend(RabbitConfig.EXCHANGE, "rk", event);
    }

    @Test
    void sendGenericEvent_doesNothingWhenEventNull() {
        publisher.sendGenericEvent(null, "rk");
        verifyNoInteractions(rabbitTemplate);
    }

    @Test
    void sendGenericEvent_doesNothingWhenRoutingKeyNull() {
        publisher.sendGenericEvent(new GenericEvent("type", null, null), null);
        verifyNoInteractions(rabbitTemplate);
    }
}
