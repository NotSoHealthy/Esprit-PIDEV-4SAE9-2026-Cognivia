package com.pidev.care.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.pidev.care.entities.Caregiver;
import com.pidev.care.entities.Doctor;
import com.pidev.care.entities.Patient;
import com.pidev.care.entities.Visit;
import com.pidev.care.entities.VisitStatus;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class VisitDtoTest {

    @Test
    void fromVisit_mapsScalarFieldsAndRelatedIds() {
        Caregiver caregiver = new Caregiver();
        caregiver.setId(1L);
        Patient patient = new Patient();
        patient.setId(2L);
        Doctor doctor = new Doctor();
        doctor.setId(3L);

        Visit visit = new Visit();
        visit.setId(10L);
        visit.setStatus(VisitStatus.SCHEDULED);
        visit.setDate(LocalDate.of(2025, 2, 1));
        visit.setCreatedAt(Instant.parse("2025-02-01T00:00:00Z"));
        visit.setCaregiver(caregiver);
        visit.setPatient(patient);
        visit.setDoctor(doctor);

        VisitDto dto = VisitDto.fromVisit(visit);
        assertThat(dto.getId()).isEqualTo(10L);
        assertThat(dto.getStatus()).isEqualTo("SCHEDULED");
        assertThat(dto.getCaregiverId()).isEqualTo(1L);
        assertThat(dto.getPatientId()).isEqualTo(2L);
        assertThat(dto.getDoctorId()).isEqualTo(3L);
    }

    @Test
    void fromVisit_handlesNullRelations() {
        Visit visit = new Visit();
        visit.setId(1L);
        visit.setStatus(VisitStatus.MISSED);
        visit.setCaregiver(null);
        visit.setPatient(null);
        visit.setDoctor(null);

        VisitDto dto = VisitDto.fromVisit(visit);
        assertThat(dto.getCaregiverId()).isNull();
        assertThat(dto.getPatientId()).isNull();
        assertThat(dto.getDoctorId()).isNull();
    }
}
