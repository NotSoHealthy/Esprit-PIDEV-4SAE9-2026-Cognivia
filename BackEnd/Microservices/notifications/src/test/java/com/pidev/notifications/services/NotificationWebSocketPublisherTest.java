package com.pidev.notifications.services;

import com.pidev.notifications.entities.Notification;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationWebSocketPublisherTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationWebSocketPublisher publisher;

    @Test
    void publishToUser_nullUserId_doesNothing() {
        publisher.publishToUser(null, new Notification());
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void publishToUser_blankUserId_doesNothing() {
        publisher.publishToUser("   ", new Notification());
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void publishToUser_nullNotification_doesNothing() {
        publisher.publishToUser("user", null);
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void publishToUser_validArguments_sendsToUserQueue() {
        Notification notification = new Notification();

        publisher.publishToUser("user-123", notification);

        verify(messagingTemplate).convertAndSendToUser("user-123", "/queue/notifications", notification);
        verifyNoMoreInteractions(messagingTemplate);
    }
}
