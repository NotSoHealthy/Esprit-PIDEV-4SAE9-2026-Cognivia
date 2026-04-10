package com.pidev.notifications.repositories;

import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.entities.RecipientType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientIdAndRecipientTypeAndReadAtIsNull(long recipientId, RecipientType recipientType);
}
