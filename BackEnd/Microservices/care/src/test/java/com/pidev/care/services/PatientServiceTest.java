package com.pidev.care.services;

import com.pidev.care.dto.PatientDto;
import com.pidev.care.entities.Patient;
import com.pidev.care.entities.PatientDoctorAssignment;
import com.pidev.care.entities.Severity;
import com.pidev.care.keycloak.KeycloakAdminClient;
import com.pidev.care.repositories.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PatientDoctorAssignmentService assignmentService;

    @Mock
    private KeycloakAdminClient keycloakAdminClient;

    @InjectMocks
    private PatientService patientService;

    @Test
    void create_throwsWhenUserIdExists() {
        UUID userId = UUID.randomUUID();
        Patient patient = new Patient();
        patient.setUserId(userId);

        when(patientRepository.findByUserId(userId)).thenReturn(List.of(new Patient()));

        assertThatThrownBy(() -> patientService.create(patient))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Patient with userId " + userId + " already exists");

        verify(patientRepository, never()).save(any());
    }

    @Test
    void create_savesWhenUserIdUnique() {
        UUID userId = UUID.randomUUID();
        Patient patient = new Patient();
        patient.setUserId(userId);

        when(patientRepository.findByUserId(userId)).thenReturn(List.of());
        when(patientRepository.save(patient)).thenReturn(patient);

        Patient saved = patientService.create(patient);

        assertThat(saved).isSameAs(patient);
        verify(patientRepository).save(patient);
    }

    @Test
    void getContactInfo_throwsWhenPatientMissing() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> patientService.getContactInfo(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Patient not found");
    }

    @Test
    void getContactInfo_throwsWhenKeycloakReturnsNull() {
        UUID userId = UUID.randomUUID();
        Patient patient = new Patient();
        patient.setId(1L);
        patient.setUserId(userId);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(keycloakAdminClient.getUserById(userId.toString())).thenReturn(Mono.justOrEmpty(null));

        assertThatThrownBy(() -> patientService.getContactInfo(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Keycloak returned empty user");
    }

    @Test
    void getContactInfo_returnsEmailAndPhoneFromKeycloakUser() {
        UUID userId = UUID.randomUUID();
        Patient patient = new Patient();
        patient.setId(1L);
        patient.setUserId(userId);

        KeycloakAdminClient.KeycloakUser kcUser = new KeycloakAdminClient.KeycloakUser(
                userId.toString(),
                "user@example.com",
                Map.of("phone_number", List.of("+21612345678")));

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(keycloakAdminClient.getUserById(userId.toString())).thenReturn(Mono.just(kcUser));

        PatientDto.PatientContactInfoDto contact = patientService.getContactInfo(1L);

        assertThat(contact.email()).isEqualTo("user@example.com");
        assertThat(contact.phoneNumber()).isEqualTo("+21612345678");
    }

    @Test
    void update_throwsWhenPatientNotFound() {
        when(patientRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> patientService.update(1L, new Patient()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Patient not found");
    }

    @Test
    void update_updatesFieldsAndSaves() {
        Patient existing = new Patient();
        existing.setId(1L);

        Patient patch = new Patient();
        patch.setFirstName("NewF");
        patch.setLastName("NewL");
        patch.setDateOfBirth(LocalDate.of(2001, 2, 3));
        patch.setCheckInFrequency(20);
        patch.setSeverity(Severity.MEDIUM);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(patientRepository.save(existing)).thenReturn(existing);

        Patient updated = patientService.update(1L, patch);

        assertThat(updated).isSameAs(existing);
        assertThat(existing.getFirstName()).isEqualTo("NewF");
        assertThat(existing.getLastName()).isEqualTo("NewL");
        assertThat(existing.getDateOfBirth()).isEqualTo(LocalDate.of(2001, 2, 3));
        assertThat(existing.getCheckInFrequency()).isEqualTo(20);
        assertThat(existing.getSeverity()).isEqualTo(Severity.MEDIUM);
        verify(patientRepository).save(existing);
    }

    @Test
    void delete_delegatesToRepository() {
        patientService.delete(10L);
        verify(patientRepository).deleteById(10L);
    }

    @Test
    void getByUserId_returnsNullWhenNoPatients() {
        UUID userId = UUID.randomUUID();
        when(patientRepository.findByUserId(userId)).thenReturn(List.of());

        assertThat(patientService.getByUserId(userId)).isNull();
    }

    @Test
    void getByUserId_returnsFirstWhenMultiplePatientsFound() {
        UUID userId = UUID.randomUUID();
        Patient p1 = new Patient();
        p1.setId(1L);
        Patient p2 = new Patient();
        p2.setId(2L);

        when(patientRepository.findByUserId(userId)).thenReturn(List.of(p1, p2));

        assertThat(patientService.getByUserId(userId)).isSameAs(p1);
    }

    @Test
    void getBySeverity_delegatesToRepository() {
        List<Patient> list = List.of(new Patient());
        when(patientRepository.findBySeverity(Severity.HIGH)).thenReturn(list);

        assertThat(patientService.getBySeverity(Severity.HIGH)).isSameAs(list);
    }

    @Test
    void getByDoctorId_filtersOnlyActiveAssignments() {
        Patient activePatient = new Patient();
        activePatient.setId(1L);
        Patient inactivePatient = new Patient();
        inactivePatient.setId(2L);

        PatientDoctorAssignment a1 = new PatientDoctorAssignment();
        a1.setActive(true);
        a1.setPatient(activePatient);

        PatientDoctorAssignment a2 = new PatientDoctorAssignment();
        a2.setActive(false);
        a2.setPatient(inactivePatient);

        when(assignmentService.getByDoctorId(5L)).thenReturn(List.of(a1, a2));

        List<Patient> result = patientService.getByDoctorId(5L);
        assertThat(result).containsExactly(activePatient);
    }

    @Test
    void getByCaregiverUserId_returnsEmptyListWhenNull() {
        assertThat(patientService.getByCaregiverUserId(null)).isEmpty();
        verify(patientRepository, never()).findByCaregiverUserId(any());
    }

    @Test
    void getByCaregiverUserId_delegatesToRepository() {
        UUID caregiverUserId = UUID.randomUUID();
        List<Patient> patients = List.of(new Patient());
        when(patientRepository.findByCaregiverUserId(caregiverUserId)).thenReturn(patients);

        assertThat(patientService.getByCaregiverUserId(caregiverUserId)).isSameAs(patients);
    }

    @Test
    void updateSeverity_throwsWhenPatientNotFound() {
        when(patientRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> patientService.updateSeverity(1L, "HIGH"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Patient not found");
    }

    @Test
    void updateSeverity_setsSeverityWhenValid() {
        Patient existing = new Patient();
        existing.setId(1L);
        existing.setSeverity(Severity.LOW);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(patientRepository.save(existing)).thenReturn(existing);

        Patient updated = patientService.updateSeverity(1L, "high");
        assertThat(updated.getSeverity()).isEqualTo(Severity.HIGH);
        verify(patientRepository).save(existing);
    }

    @Test
    void updateSeverity_throwsWhenInvalidSeverity() {
        Patient existing = new Patient();
        existing.setId(1L);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> patientService.updateSeverity(1L, "not-a-severity"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid severity value");

        verify(patientRepository, never()).save(any());
    }
}
