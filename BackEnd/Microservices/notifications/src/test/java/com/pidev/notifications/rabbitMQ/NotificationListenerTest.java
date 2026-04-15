package com.pidev.notifications.rabbitMQ;

import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.events.GenericEvent;
import com.pidev.notifications.services.NotificationService;
import com.pidev.notifications.services.NotificationWebSocketPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationListenerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private NotificationMapper notificationMapper;

    @Mock
    private NotificationWebSocketPublisher webSocketPublisher;

    @InjectMocks
    private NotificationListener notificationListener;

    @Captor
    private ArgumentCaptor<String> userIdCaptor;

    @Captor
    private ArgumentCaptor<Notification> notificationCaptor;

    @Test
    void handle_nullEvent_doesNothing() {
        notificationListener.handle(null);

        verifyNoInteractions(notificationService, notificationMapper, webSocketPublisher);
    }

    @Test
    void handle_event_savesAndPublishesForEachDelivery() {
        GenericEvent event = new GenericEvent("VISIT_SCHEDULED", null);

        Notification n1 = new Notification();
        Notification n2 = new Notification();

        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();

        List<NotificationMapper.NotificationDelivery> deliveries = List.of(
                new NotificationMapper.NotificationDelivery(n1, user1),
                new NotificationMapper.NotificationDelivery(n2, user2));

        when(notificationMapper.fromEventDeliveries(event)).thenReturn(deliveries);
        when(notificationService.saveNotification(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        notificationListener.handle(event);

        verify(notificationMapper).fromEventDeliveries(event);
        verify(notificationService).saveNotification(n1);
        verify(notificationService).saveNotification(n2);

        verify(webSocketPublisher, times(2)).publishToUser(userIdCaptor.capture(), notificationCaptor.capture());

        assertThat(userIdCaptor.getAllValues())
                .containsExactlyInAnyOrder(user1.toString(), user2.toString());
        assertThat(notificationCaptor.getAllValues())
                .containsExactlyInAnyOrder(n1, n2);

        verifyNoMoreInteractions(notificationMapper, notificationService, webSocketPublisher);
    }

    @Test
    void handle_deliveryWithNullRecipientUserId_publishesWithNullUserId() {
        GenericEvent event = new GenericEvent("VISIT_SCHEDULED", null);
        Notification n1 = new Notification();

        List<NotificationMapper.NotificationDelivery> deliveries = List.of(
                new NotificationMapper.NotificationDelivery(n1, null));

        when(notificationMapper.fromEventDeliveries(event)).thenReturn(deliveries);
        when(notificationService.saveNotification(n1)).thenReturn(n1);

        notificationListener.handle(event);

        verify(notificationMapper).fromEventDeliveries(event);
        verify(notificationService).saveNotification(n1);
        verify(webSocketPublisher).publishToUser(null, n1);
        verifyNoMoreInteractions(notificationMapper, notificationService, webSocketPublisher);
    }
}
