package com.pidev.care.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.pidev.care.entities.Caregiver;
import com.pidev.care.entities.EmergencyContact;
import com.pidev.care.entities.Gender;
import com.pidev.care.entities.Patient;
import com.pidev.care.entities.Severity;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PatientDtoTest {

    @Test
    void fromPatient_mapsScalarFieldsAndLists() {
        EmergencyContact e1 = new EmergencyContact();
        e1.setId(10L);
        Caregiver c1 = new Caregiver();
        c1.setId(20L);

        Patient patient = new Patient();
        patient.setId(1L);
        patient.setUserId(UUID.randomUUID());
        patient.setFirstName("F");
        patient.setLastName("L");
        patient.setGender(Gender.FEMALE);
        patient.setDateOfBirth(LocalDate.of(1990, 5, 10));
        patient.setCheckInFrequency(15);
        patient.setSeverity(Severity.LOW);
        patient.setEmergencyContactList(List.of(e1));
        patient.setCaregiverList(List.of(c1));

        PatientDto dto = PatientDto.fromPatient(patient);
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getGender()).isEqualTo("FEMALE");
        assertThat(dto.getSeverity()).isEqualTo("LOW");
        assertThat(dto.getEmergencyContactIdList()).containsExactly(10L);
        assertThat(dto.getCaregiverIdList()).containsExactly(20L);
    }

    @Test
    void fromPatient_handlesNullLists() {
        Patient patient = new Patient();
        patient.setId(1L);
        patient.setGender(Gender.MALE);
        patient.setSeverity(Severity.HIGH);
        patient.setEmergencyContactList(null);
        patient.setCaregiverList(null);

        PatientDto dto = PatientDto.fromPatient(patient);
        assertThat(dto.getEmergencyContactIdList()).isNull();
        assertThat(dto.getCaregiverIdList()).isNull();
    }
}
