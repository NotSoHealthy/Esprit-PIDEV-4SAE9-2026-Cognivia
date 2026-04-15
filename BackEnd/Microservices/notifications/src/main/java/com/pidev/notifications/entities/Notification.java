package com.pidev.notifications.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private Long recipientId;
    @Enumerated(EnumType.STRING)
    private RecipientType recipientType;
    private String title;
    private String message;
    private String eventType;
    private Long referenceId;
    private Boolean seen;
    private Instant readAt;
    @Enumerated(EnumType.STRING)
    private NotificationPriority priority;
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (priority == null) {
            priority = NotificationPriority.NORMAL;
        }
        if (seen == null) {
            seen = false;
        }
    }
}