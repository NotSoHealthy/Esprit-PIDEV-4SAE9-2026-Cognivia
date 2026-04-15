package com.pidev.notifications.services;

import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.entities.NotificationPriority;
import com.pidev.notifications.entities.RecipientType;
import com.pidev.notifications.repositories.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Captor
    private ArgumentCaptor<Notification> notificationCaptor;

    @Test
    void getAllNotifications_delegatesToRepository() {
        List<Notification> notifications = List.of(new Notification());
        when(notificationRepository.findAll()).thenReturn(notifications);

        List<Notification> result = notificationService.getAllNotifications();

        assertThat(result).isSameAs(notifications);
        verify(notificationRepository).findAll();
    }

    @Test
    void getNotificationById_returnsNotificationWhenFound() {
        UUID id = UUID.randomUUID();
        Notification notification = new Notification();
        notification.setId(id);
        when(notificationRepository.findById(id)).thenReturn(Optional.of(notification));

        Notification result = notificationService.getNotificationById(id);

        assertThat(result).isSameAs(notification);
        verify(notificationRepository).findById(id);
    }

    @Test
    void getNotificationById_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.getNotificationById(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Notification not found");

        verify(notificationRepository).findById(id);
    }

    @Test
    void getByRecipientId_delegatesToRepository() {
        long recipientId = 123L;
        RecipientType recipientType = RecipientType.DOCTOR;
        List<Notification> notifications = List.of(new Notification());
        when(notificationRepository.findByRecipientIdAndRecipientTypeAndReadAtIsNull(recipientId, recipientType))
                .thenReturn(notifications);

        List<Notification> result = notificationService.getByRecipientId(recipientId, recipientType);

        assertThat(result).isSameAs(notifications);
        verify(notificationRepository).findByRecipientIdAndRecipientTypeAndReadAtIsNull(recipientId, recipientType);
    }

    @Test
    void saveNotification_delegatesToRepository() {
        Notification notification = new Notification();
        Notification saved = new Notification();
        when(notificationRepository.save(notification)).thenReturn(saved);

        Notification result = notificationService.saveNotification(notification);

        assertThat(result).isSameAs(saved);
        verify(notificationRepository).save(notification);
    }

    @Test
    void updateNotification_updatesFieldsAndSaves() {
        UUID id = UUID.randomUUID();

        Notification existing = new Notification();
        existing.setId(id);
        existing.setRecipientId(1L);
        existing.setTitle("old");
        existing.setMessage("old");
        existing.setEventType("old");
        existing.setReferenceId(1L);
        existing.setReadAt(Instant.parse("2020-01-01T00:00:00Z"));
        existing.setPriority(NotificationPriority.HIGH);

        Notification update = new Notification();
        update.setRecipientId(99L);
        update.setTitle("new title");
        update.setMessage("new msg");
        update.setEventType("NEW_EVENT");
        update.setReferenceId(42L);
        update.setReadAt(null);
        update.setPriority(NotificationPriority.NORMAL);

        when(notificationRepository.findById(id)).thenReturn(Optional.of(existing));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        Notification result = notificationService.updateNotification(id, update);

        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getRecipientId()).isEqualTo(99L);
        assertThat(result.getTitle()).isEqualTo("new title");
        assertThat(result.getMessage()).isEqualTo("new msg");
        assertThat(result.getEventType()).isEqualTo("NEW_EVENT");
        assertThat(result.getReferenceId()).isEqualTo(42L);
        assertThat(result.getReadAt()).isNull();
        assertThat(result.getPriority()).isEqualTo(NotificationPriority.NORMAL);

        verify(notificationRepository).findById(id);
        verify(notificationRepository).save(existing);
        verifyNoMoreInteractions(notificationRepository);
    }

    @Test
    void updateNotification_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.updateNotification(id, new Notification()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Notification not found");

        verify(notificationRepository).findById(id);
        verifyNoMoreInteractions(notificationRepository);
    }

    @Test
    void markNotificationAsRead_setsReadAtAndSaves() {
        UUID id = UUID.randomUUID();
        Notification existing = new Notification();
        existing.setId(id);
        existing.setReadAt(null);

        when(notificationRepository.findById(id)).thenReturn(Optional.of(existing));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        Instant before = Instant.now();
        Notification result = notificationService.markNotificationAsRead(id);
        Instant after = Instant.now();

        assertThat(result.getReadAt()).isNotNull();
        assertThat(result.getReadAt()).isBetween(before.minusSeconds(1), after.plusSeconds(1));

        verify(notificationRepository).findById(id);
        verify(notificationRepository).save(existing);
    }

    @Test
    void markNotificationAsRead_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markNotificationAsRead(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Notification not found");

        verify(notificationRepository).findById(id);
        verifyNoMoreInteractions(notificationRepository);
    }

    @Test
    void markNotificationAsSeen_setsSeenAndSaves() {
        UUID id = UUID.randomUUID();
        Notification existing = new Notification();
        existing.setId(id);
        existing.setSeen(false);

        when(notificationRepository.findById(id)).thenReturn(Optional.of(existing));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        Notification result = notificationService.markNotificationAsSeen(id);

        assertThat(result.getSeen()).isTrue();

        verify(notificationRepository).findById(id);
        verify(notificationRepository).save(existing);
    }

    @Test
    void markNotificationAsSeen_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markNotificationAsSeen(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Notification not found");

        verify(notificationRepository).findById(id);
        verifyNoMoreInteractions(notificationRepository);
    }

    @Test
    void deleteNotification_delegatesToRepository() {
        UUID id = UUID.randomUUID();

        notificationService.deleteNotification(id);

        verify(notificationRepository).deleteById(id);
        verifyNoMoreInteractions(notificationRepository);
    }
}
