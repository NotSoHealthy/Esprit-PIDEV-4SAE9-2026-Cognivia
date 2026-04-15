package com.pidev.monitoring.rabbitMQ;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;

class RabbitConfigTest {

    @Test
    void exchange_usesExpectedName() {
        RabbitConfig cfg = new RabbitConfig();
        TopicExchange exchange = cfg.exchange();
        assertEquals(RabbitConfig.EXCHANGE, exchange.getName());
    }

    @Test
    void jsonMessageConverter_isJackson() {
        RabbitConfig cfg = new RabbitConfig();
        MessageConverter converter = cfg.jsonMessageConverter();
        assertTrue(converter instanceof Jackson2JsonMessageConverter);
    }

    @Test
    void rabbitTemplate_setsMessageConverter() {
        RabbitConfig cfg = new RabbitConfig();
        ConnectionFactory cf = mock(ConnectionFactory.class);
        MessageConverter converter = new Jackson2JsonMessageConverter();

        RabbitTemplate template = cfg.rabbitTemplate(cf, converter);
        assertSame(converter, template.getMessageConverter());
    }
}
