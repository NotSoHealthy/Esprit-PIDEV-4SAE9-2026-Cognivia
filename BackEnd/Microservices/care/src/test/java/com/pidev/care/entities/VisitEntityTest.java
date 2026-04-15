package com.pidev.care.entities;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class VisitEntityTest {

    @Test
    void prePersist_setsDefaultsWhenNull() {
        Visit visit = new Visit();
        visit.setCreatedAt(null);
        visit.setStatus(null);

        visit.prePersist();
        assertThat(visit.getCreatedAt()).isNotNull();
        assertThat(visit.getStatus()).isEqualTo(VisitStatus.SCHEDULED);
    }

    @Test
    void prePersist_doesNotOverrideExistingValues() {
        Instant existing = Instant.parse("2025-01-01T00:00:00Z");
        Visit visit = new Visit();
        visit.setCreatedAt(existing);
        visit.setStatus(VisitStatus.COMPLETED);

        visit.prePersist();
        assertThat(visit.getCreatedAt()).isEqualTo(existing);
        assertThat(visit.getStatus()).isEqualTo(VisitStatus.COMPLETED);
    }
}
