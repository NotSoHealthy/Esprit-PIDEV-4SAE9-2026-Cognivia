package com.pidev.care.rabbitMQ;

import static org.assertj.core.api.Assertions.assertThat;
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
        assertThat(exchange.getName()).isEqualTo(RabbitConfig.EXCHANGE);
    }

    @Test
    void jsonMessageConverter_isJacksonConverter() {
        RabbitConfig cfg = new RabbitConfig();
        MessageConverter converter = cfg.jsonMessageConverter();
        assertThat(converter).isInstanceOf(Jackson2JsonMessageConverter.class);
    }

    @Test
    void rabbitTemplate_setsMessageConverter() {
        RabbitConfig cfg = new RabbitConfig();
        ConnectionFactory connectionFactory = mock(ConnectionFactory.class);
        MessageConverter converter = new Jackson2JsonMessageConverter();

        RabbitTemplate template = cfg.rabbitTemplate(connectionFactory, converter);
        assertThat(template.getMessageConverter()).isSameAs(converter);
    }
}
