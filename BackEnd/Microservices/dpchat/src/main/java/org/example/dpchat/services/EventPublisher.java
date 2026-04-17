package org.example.dpchat.services;

import org.example.dpchat.dto.GenericEvent;
import org.example.dpchat.config.RabbitConfig;
import org.example.dpchat.entities.Message;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class EventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public EventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishChatEvent(Message message) {
        if (message == null || message.getRecipientId() == null) {
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("messageId", message.getId());
        payload.put("senderId", message.getSenderId());
        payload.put("senderFullName", message.getSenderName());
        payload.put("recipientId", message.getRecipientId());
        
        // Truncate content for notification if too long
        String content = message.getContent();
        if (content != null && content.length() > 50) {
            content = content.substring(0, 47) + "...";
        }
        payload.put("content", content);

        GenericEvent event = new GenericEvent("NEW_CHAT_MESSAGE", payload);
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, "chat.notification", event);
    }
}
