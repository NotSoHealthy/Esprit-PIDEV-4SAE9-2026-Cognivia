package com.pidev.care.entities;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class NoteEntityTest {

    @Test
    void prePersist_setsCreatedAtWhenNull() {
        Note note = new Note();
        note.setCreatedAt(null);

        note.prePersist();
        assertThat(note.getCreatedAt()).isNotNull();
    }

    @Test
    void prePersist_doesNotOverrideExistingCreatedAt() {
        Instant existing = Instant.parse("2025-01-01T00:00:00Z");
        Note note = new Note();
        note.setCreatedAt(existing);

        note.prePersist();
        assertThat(note.getCreatedAt()).isEqualTo(existing);
    }

    @Test
    void preUpdate_setsUpdatedAt() {
        Note note = new Note();
        note.setUpdatedAt(null);

        note.preUpdate();
        assertThat(note.getUpdatedAt()).isNotNull();
    }
}
