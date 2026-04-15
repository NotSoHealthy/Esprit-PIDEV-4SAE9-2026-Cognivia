package com.pidev.care.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pidev.care.dto.VisitDto;
import com.pidev.care.entities.Caregiver;
import com.pidev.care.entities.Doctor;
import com.pidev.care.entities.Patient;
import com.pidev.care.entities.Visit;
import com.pidev.care.entities.VisitStatus;
import com.pidev.care.services.VisitService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VisitControllerTest {

    @Mock
    private VisitService visitService;

    private VisitController controller;

    @BeforeEach
    void setUp() {
        controller = new VisitController(visitService);
    }

    @Test
    void getAllVisits_delegatesToService() {
        List<Visit> visits = List.of(new Visit());
        when(visitService.getAll()).thenReturn(visits);

        assertThat(controller.getAllVisits()).isSameAs(visits);
    }

    @Test
    void getVisitById_delegatesToService() {
        Visit visit = new Visit();
        when(visitService.getById(1L)).thenReturn(visit);

        assertThat(controller.getVisitById(1L)).isSameAs(visit);
    }

    @Test
    void getVisitDtoById_mapsViaDto() {
        Caregiver caregiver = new Caregiver();
        caregiver.setId(10L);
        Patient patient = new Patient();
        patient.setId(20L);
        Doctor doctor = new Doctor();
        doctor.setId(30L);

        Visit visit = new Visit();
        visit.setId(5L);
        visit.setStatus(VisitStatus.COMPLETED);
        visit.setDate(LocalDate.of(2025, 1, 1));
        visit.setCreatedAt(Instant.parse("2025-01-01T00:00:00Z"));
        visit.setCaregiver(caregiver);
        visit.setPatient(patient);
        visit.setDoctor(doctor);
        when(visitService.getById(5L)).thenReturn(visit);

        VisitDto dto = controller.getVisitDtoById(5L);
        assertThat(dto.getId()).isEqualTo(5L);
        assertThat(dto.getStatus()).isEqualTo("COMPLETED");
        assertThat(dto.getCaregiverId()).isEqualTo(10L);
        assertThat(dto.getPatientId()).isEqualTo(20L);
        assertThat(dto.getDoctorId()).isEqualTo(30L);
    }

    @Test
    void getVisitsByPatientId_delegatesToService() {
        List<Visit> visits = List.of(new Visit());
        when(visitService.getByPatientId(1L)).thenReturn(visits);

        assertThat(controller.getVisitsByPatientId(1L)).isSameAs(visits);
    }

    @Test
    void getVisitsByCaregiverId_delegatesToService() {
        List<Visit> visits = List.of(new Visit());
        when(visitService.getByCaregiverId(2L)).thenReturn(visits);

        assertThat(controller.getVisitsByCaregiverId(2L)).isSameAs(visits);
    }

    @Test
    void createVisit_delegatesToService() {
        Visit input = new Visit();
        Visit created = new Visit();
        when(visitService.create(input)).thenReturn(created);

        assertThat(controller.createVisit(input)).isSameAs(created);
    }

    @Test
    void updateVisit_delegatesToService() {
        Visit patch = new Visit();
        Visit updated = new Visit();
        when(visitService.update(1L, patch)).thenReturn(updated);

        assertThat(controller.updateVisit(1L, patch)).isSameAs(updated);
    }

    @Test
    void markVisitAsCompleted_delegatesToService() {
        assertThat(controller.markVisitAsCompleted(1L)).isNull();
        verify(visitService).markVisitAsCompleted(1L);
    }

    @Test
    void deleteVisit_delegatesToService() {
        controller.deleteVisit(1L);
        verify(visitService).delete(1L);
    }
}
