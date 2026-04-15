package com.pidev.care.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.pidev.care.entities.Doctor;
import com.pidev.care.entities.Note;
import com.pidev.care.entities.PatientDoctorAssignment;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class DoctorDtoTest {

    @Test
    void fromDoctor_mapsScalarFieldsAndLists() {
        Note n1 = new Note();
        n1.setId(10L);
        PatientDoctorAssignment a1 = new PatientDoctorAssignment();
        a1.setId(20L);

        Doctor doctor = new Doctor();
        doctor.setId(1L);
        doctor.setUserId(UUID.randomUUID());
        doctor.setFirstName("F");
        doctor.setLastName("L");
        doctor.setSpecialty("Spec");
        doctor.setLicenseNumber("LIC");
        doctor.setNotes(List.of(n1));
        doctor.setPatientDoctorAssignments(List.of(a1));

        DoctorDto dto = DoctorDto.fromDoctor(doctor);
        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getSpecialty()).isEqualTo("Spec");
        assertThat(dto.getNoteIdList()).containsExactly(10L);
        assertThat(dto.getPatientDoctorAssignmentIdList()).containsExactly(20L);
    }

    @Test
    void fromDoctor_handlesNullCollections() {
        Doctor doctor = new Doctor();
        doctor.setId(1L);
        doctor.setNotes(null);
        doctor.setPatientDoctorAssignments(null);

        DoctorDto dto = DoctorDto.fromDoctor(doctor);
        assertThat(dto.getNoteIdList()).isNull();
        assertThat(dto.getPatientDoctorAssignmentIdList()).isNull();
    }
}
