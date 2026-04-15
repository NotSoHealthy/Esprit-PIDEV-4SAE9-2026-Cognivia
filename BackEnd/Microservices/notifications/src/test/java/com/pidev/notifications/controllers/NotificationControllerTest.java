package com.pidev.notifications.controllers;

import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.entities.RecipientType;
import com.pidev.notifications.services.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController controller;

    @Test
    void getNotifications_delegates() {
        List<Notification> notifications = List.of(new Notification());
        when(notificationService.getAllNotifications()).thenReturn(notifications);

        List<Notification> result = controller.getNotifications();

        assertThat(result).isSameAs(notifications);
        verify(notificationService).getAllNotifications();
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void getNotificationById_delegates() {
        UUID id = UUID.randomUUID();
        Notification notification = new Notification();
        when(notificationService.getNotificationById(id)).thenReturn(notification);

        Notification result = controller.getNotificationById(id);

        assertThat(result).isSameAs(notification);
        verify(notificationService).getNotificationById(id);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void getRecipientNotifications_delegates() {
        long recipientId = 123L;
        RecipientType recipientType = RecipientType.DOCTOR;
        List<Notification> notifications = List.of(new Notification());
        when(notificationService.getByRecipientId(recipientId, recipientType)).thenReturn(notifications);

        List<Notification> result = controller.getRecipientNotifications(recipientId, recipientType);

        assertThat(result).isSameAs(notifications);
        verify(notificationService).getByRecipientId(recipientId, recipientType);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void getPharmacyNotifications_delegatesWithPharmacyType() {
        long pharmacyId = 77L;
        List<Notification> notifications = List.of(new Notification());
        when(notificationService.getByRecipientId(pharmacyId, RecipientType.PHARMACY)).thenReturn(notifications);

        List<Notification> result = controller.getPharmacyNotifications(pharmacyId);

        assertThat(result).isSameAs(notifications);
        verify(notificationService).getByRecipientId(pharmacyId, RecipientType.PHARMACY);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void createNotification_delegates() {
        Notification input = new Notification();
        Notification saved = new Notification();
        when(notificationService.saveNotification(input)).thenReturn(saved);

        Notification result = controller.createNotification(input);

        assertThat(result).isSameAs(saved);
        verify(notificationService).saveNotification(input);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void updateNotification_delegates() {
        UUID id = UUID.randomUUID();
        Notification input = new Notification();
        Notification updated = new Notification();
        when(notificationService.updateNotification(id, input)).thenReturn(updated);

        Notification result = controller.updateNotification(id, input);

        assertThat(result).isSameAs(updated);
        verify(notificationService).updateNotification(id, input);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void markAsRead_delegates() {
        UUID id = UUID.randomUUID();
        Notification updated = new Notification();
        when(notificationService.markNotificationAsRead(id)).thenReturn(updated);

        Notification result = controller.markAsRead(id);

        assertThat(result).isSameAs(updated);
        verify(notificationService).markNotificationAsRead(id);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void markAsSeen_delegates() {
        UUID id = UUID.randomUUID();
        Notification updated = new Notification();
        when(notificationService.markNotificationAsSeen(id)).thenReturn(updated);

        Notification result = controller.markAsSeen(id);

        assertThat(result).isSameAs(updated);
        verify(notificationService).markNotificationAsSeen(id);
        verifyNoMoreInteractions(notificationService);
    }

    @Test
    void deleteNotification_delegates() {
        UUID id = UUID.randomUUID();

        controller.deleteNotification(id);

        verify(notificationService).deleteNotification(id);
        verifyNoMoreInteractions(notificationService);
    }
}
