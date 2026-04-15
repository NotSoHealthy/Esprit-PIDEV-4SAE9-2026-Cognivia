package com.pidev.notifications.rabbitMQ;

import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.events.GenericEvent;
import com.pidev.notifications.services.NotificationService;
import com.pidev.notifications.services.NotificationWebSocketPublisher;
import lombok.AllArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class NotificationListener {
    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;
    private final NotificationWebSocketPublisher webSocketPublisher;

    @RabbitListener(queues = "notifications.queue")
    public void handle(GenericEvent event) {
        log.info("Received event: {} from RabbitMQ", event != null ? event.getEventType() : "null");
        if (event != null) {
            try {
                List<NotificationMapper.NotificationDelivery> deliveries = notificationMapper.fromEventDeliveries(event);
                log.info("Mapped event to {} deliveries", deliveries.size());
                deliveries.forEach(delivery -> {
                    Notification saved = notificationService.saveNotification(delivery.notification());
                    String recipientUserId = delivery.recipientUserId() == null ? null
                            : delivery.recipientUserId().toString();
                    log.info("Publishing notification to user: {} via WebSocket", recipientUserId);
                    webSocketPublisher.publishToUser(recipientUserId, saved);
                });
            } catch (Throwable t) {
                log.error("CRITICAL: Failed to process event. Acknowledging to prevent loop. Error: {}", t.getMessage(), t);
            }
        }
    }
}
