package com.pidev.notifications.services;

import com.pidev.notifications.entities.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishToUser(String keycloakUserId, Notification notification) {
        if (keycloakUserId == null || keycloakUserId.isBlank() || notification == null) {
            return;
        }
        messagingTemplate.convertAndSendToUser(keycloakUserId, "/queue/notifications", notification);
    }
}
