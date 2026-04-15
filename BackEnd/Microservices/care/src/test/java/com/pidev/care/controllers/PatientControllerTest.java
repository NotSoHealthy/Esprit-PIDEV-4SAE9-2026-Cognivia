package com.pidev.care.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pidev.care.dto.PatientDto;
import com.pidev.care.entities.Gender;
import com.pidev.care.entities.Patient;
import com.pidev.care.entities.Severity;
import com.pidev.care.services.PatientService;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PatientControllerTest {

    @Mock
    private PatientService patientService;

    private PatientController controller;

    @BeforeEach
    void setUp() {
        controller = new PatientController(patientService);
    }

    @Test
    void getAllPatients_delegatesToService() {
        List<Patient> patients = List.of(new Patient(), new Patient());
        when(patientService.getAll()).thenReturn(patients);

        assertThat(controller.getAllPatients()).isSameAs(patients);
    }

    @Test
    void getPatientsBySeverity_delegatesToService() {
        List<Patient> patients = List.of(new Patient());
        when(patientService.getBySeverity(Severity.HIGH)).thenReturn(patients);

        assertThat(controller.getPatientsBySeverity(Severity.HIGH)).isSameAs(patients);
    }

    @Test
    void getPatientById_delegatesToService() {
        Patient patient = new Patient();
        when(patientService.getById(1L)).thenReturn(patient);

        assertThat(controller.getPatientById(1L)).isSameAs(patient);
    }

    @Test
    void getPatientDtoById_mapsViaDto() {
        Patient patient = new Patient();
        patient.setId(2L);
        patient.setUserId(UUID.randomUUID());
        patient.setFirstName("F");
        patient.setLastName("L");
        patient.setGender(Gender.MALE);
        patient.setDateOfBirth(LocalDate.of(2000, 1, 1));
        patient.setCheckInFrequency(30);
        patient.setSeverity(Severity.MEDIUM);
        when(patientService.getById(2L)).thenReturn(patient);

        PatientDto dto = controller.getPatientDtoById(2L);
        assertThat(dto.getId()).isEqualTo(2L);
        assertThat(dto.getGender()).isEqualTo("MALE");
        assertThat(dto.getSeverity()).isEqualTo("MEDIUM");
    }

    @Test
    void getPatientByUserId_delegatesToService() {
        UUID userId = UUID.randomUUID();
        Patient patient = new Patient();
        when(patientService.getByUserId(userId)).thenReturn(patient);

        assertThat(controller.getPatientByUserId(userId)).isSameAs(patient);
    }

    @Test
    void getPatientsByDoctorId_delegatesToService() {
        List<Patient> patients = List.of(new Patient());
        when(patientService.getByDoctorId(3L)).thenReturn(patients);

        assertThat(controller.getPatientsByDoctorId(3L)).isSameAs(patients);
    }

    @Test
    void getPatientsByCaregiverUserId_delegatesToService() {
        UUID userId = UUID.randomUUID();
        List<Patient> patients = List.of(new Patient());
        when(patientService.getByCaregiverUserId(userId)).thenReturn(patients);

        assertThat(controller.getPatientsByCaregiverUserId(userId)).isSameAs(patients);
    }

    @Test
    void getPatientContactInfo_delegatesToService() {
        PatientDto.PatientContactInfoDto contact = new PatientDto.PatientContactInfoDto("a@b.com", "+1");
        when(patientService.getContactInfo(10L)).thenReturn(contact);

        assertThat(controller.getPatientContactInfo(10L)).isSameAs(contact);
    }

    @Test
    void createPatient_delegatesToService() {
        Patient input = new Patient();
        Patient created = new Patient();
        when(patientService.create(input)).thenReturn(created);

        assertThat(controller.createPatient(input)).isSameAs(created);
    }

    @Test
    void registerPatient_setsUserIdBeforeCreate() {
        UUID userId = UUID.randomUUID();
        Patient toCreate = new Patient();
        when(patientService.create(any(Patient.class))).thenAnswer(inv -> inv.getArgument(0));

        Patient created = controller.registerPatient(userId, toCreate);
        assertThat(created.getUserId()).isEqualTo(userId);

        ArgumentCaptor<Patient> captor = ArgumentCaptor.forClass(Patient.class);
        verify(patientService).create(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
    }

    @Test
    void updatePatient_delegatesToService() {
        Patient patch = new Patient();
        Patient updated = new Patient();
        when(patientService.update(5L, patch)).thenReturn(updated);

        assertThat(controller.updatePatient(5L, patch)).isSameAs(updated);
    }

    @Test
    void updatePatientSeverity_delegatesToService() {
        Patient updated = new Patient();
        when(patientService.updateSeverity(6L, "HIGH")).thenReturn(updated);

        assertThat(controller.updatePatientSeverity(6L, "HIGH")).isSameAs(updated);
        verify(patientService).updateSeverity(6L, "HIGH");
    }

    @Test
    void deletePatient_delegatesToService() {
        controller.deletePatient(7L);
        verify(patientService).delete(7L);
    }
}
