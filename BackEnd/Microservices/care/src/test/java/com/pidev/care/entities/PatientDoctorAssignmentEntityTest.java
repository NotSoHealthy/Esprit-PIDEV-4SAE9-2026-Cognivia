package com.pidev.care.entities;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class PatientDoctorAssignmentEntityTest {

    @Test
    void prePersist_setsCreatedAtWhenNull() {
        PatientDoctorAssignment a = new PatientDoctorAssignment();
        a.setCreatedAt(null);

        a.prePersist();
        assertThat(a.getCreatedAt()).isNotNull();
    }

    @Test
    void prePersist_doesNotOverrideExistingCreatedAt() {
        Instant existing = Instant.parse("2025-01-01T00:00:00Z");
        PatientDoctorAssignment a = new PatientDoctorAssignment();
        a.setCreatedAt(existing);

        a.prePersist();
        assertThat(a.getCreatedAt()).isEqualTo(existing);
    }
}
