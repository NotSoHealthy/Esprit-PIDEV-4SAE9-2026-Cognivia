package com.pidev.notifications;

import com.pidev.notifications.events.GenericEvent;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class NotificationListener {

    @RabbitListener(queues = "notifications.queue")
    public void handle(GenericEvent event) {
        System.out.println("Event received: " + event);

        // route logic based on type
    }
}
