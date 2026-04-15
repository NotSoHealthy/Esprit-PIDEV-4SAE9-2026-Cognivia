package com.pidev.notifications.entities;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationTest {

    @Test
    void prePersist_setsDefaultsWhenNull() {
        Notification notification = new Notification();
        notification.setCreatedAt(null);
        notification.setPriority(null);
        notification.setSeen(null);

        notification.prePersist();

        assertThat(notification.getCreatedAt()).isNotNull();
        assertThat(notification.getCreatedAt()).isBeforeOrEqualTo(Instant.now());
        assertThat(notification.getPriority()).isEqualTo(NotificationPriority.NORMAL);
        assertThat(notification.getSeen()).isFalse();
    }

    @Test
    void prePersist_doesNotOverrideExistingValues() {
        Notification notification = new Notification();
        Instant createdAt = Instant.parse("2026-01-01T00:00:00Z");
        notification.setCreatedAt(createdAt);
        notification.setPriority(NotificationPriority.HIGH);
        notification.setSeen(true);

        notification.prePersist();

        assertThat(notification.getCreatedAt()).isEqualTo(createdAt);
        assertThat(notification.getPriority()).isEqualTo(NotificationPriority.HIGH);
        assertThat(notification.getSeen()).isTrue();
    }
}
