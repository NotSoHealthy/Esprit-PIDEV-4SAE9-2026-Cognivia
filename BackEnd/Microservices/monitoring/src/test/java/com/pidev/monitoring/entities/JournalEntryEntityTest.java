package com.pidev.monitoring.entities;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class JournalEntryEntityTest {

    @Test
    void prePersist_setsCreatedAtWhenNull() {
        JournalEntry entry = new JournalEntry();
        entry.setCreatedAt(null);
        entry.prePersist();
        assertNotNull(entry.getCreatedAt());
    }

    @Test
    void prePersist_doesNotOverrideExistingCreatedAt() {
        Instant existing = Instant.parse("2026-01-01T00:00:00Z");
        JournalEntry entry = new JournalEntry();
        entry.setCreatedAt(existing);
        entry.prePersist();
        assertEquals(existing, entry.getCreatedAt());
    }

    @Test
    void preUpdate_setsUpdatedAt() {
        JournalEntry entry = new JournalEntry();
        entry.setUpdatedAt(null);
        entry.preUpdate();
        assertNotNull(entry.getUpdatedAt());
    }
}
