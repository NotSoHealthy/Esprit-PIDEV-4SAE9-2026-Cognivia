package com.pidev.notifications.services;

import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.entities.RecipientType;
import com.pidev.notifications.repositories.NotificationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public List<Notification> getAllNotifications() {return notificationRepository.findAll();}

    public Notification getNotificationById(UUID id) {
        return notificationRepository.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    public List<Notification> getByRecipientId(long recipientId, RecipientType recipientType) {
        return notificationRepository.findByRecipientIdAndRecipientTypeAndReadAtIsNull(recipientId, recipientType);
    }

    public Notification saveNotification(Notification notification) {
        return notificationRepository.save(notification);
    }

    public Notification updateNotification(UUID id, Notification notification) {
        Notification existing = notificationRepository.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));

        existing.setRecipientId(notification.getRecipientId());
        existing.setTitle(notification.getTitle());
        existing.setMessage(notification.getMessage());
        existing.setEventType(notification.getEventType());
        existing.setReferenceId(notification.getReferenceId());
        existing.setReadAt(notification.getReadAt());
        existing.setPriority(notification.getPriority());

        return notificationRepository.save(existing);
    }

    public Notification markNotificationAsRead(UUID id) {
        Notification notification = notificationRepository.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setReadAt(Instant.now());
        return notificationRepository.save(notification);
    }

    public Notification markNotificationAsSeen(UUID id) {
        Notification notification = notificationRepository.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setSeen(true);
        return notificationRepository.save(notification);
    }

    public void deleteNotification(UUID id) {notificationRepository.deleteById(id);}
}
