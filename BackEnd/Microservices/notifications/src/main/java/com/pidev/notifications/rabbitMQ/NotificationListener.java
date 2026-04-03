package com.pidev.notifications.rabbitMQ;

import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.events.GenericEvent;
import com.pidev.notifications.services.NotificationService;
import lombok.AllArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class NotificationListener {
    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;

    @RabbitListener(queues = "notifications.queue")
    public void handle(GenericEvent event) {
        if (event != null) {
            List<Notification> notificationList = notificationMapper.fromEvent(event);
            notificationList.forEach(notificationService::saveNotification);
        }
    }
}
