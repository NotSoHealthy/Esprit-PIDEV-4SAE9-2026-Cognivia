package com.pidev.monitoring.entities;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class VisitReportEntityTest {

    @Test
    void prePersist_setsCreatedAtWhenNull() {
        VisitReport report = new VisitReport();
        report.setCreatedAt(null);
        report.prePersist();
        assertNotNull(report.getCreatedAt());
    }

    @Test
    void prePersist_doesNotOverrideExistingCreatedAt() {
        Instant existing = Instant.parse("2026-01-01T00:00:00Z");
        VisitReport report = new VisitReport();
        report.setCreatedAt(existing);
        report.prePersist();
        assertEquals(existing, report.getCreatedAt());
    }

    @Test
    void preUpdate_setsUpdatedAt() {
        VisitReport report = new VisitReport();
        report.setUpdatedAt(null);
        report.preUpdate();
        assertNotNull(report.getUpdatedAt());
    }
}
