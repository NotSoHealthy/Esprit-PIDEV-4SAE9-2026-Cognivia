package com.pidev.care.services;

import com.pidev.care.entities.Doctor;
import com.pidev.care.entities.Patient;
import com.pidev.care.entities.PatientDoctorAssignment;
import com.pidev.care.repositories.PatientDoctorAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientDoctorAssignmentServiceTest {

    @Mock
    private PatientDoctorAssignmentRepository repository;

    @InjectMocks
    private PatientDoctorAssignmentService service;

    @Test
    void getAll_delegates() {
        List<PatientDoctorAssignment> list = List.of(new PatientDoctorAssignment());
        when(repository.findAll()).thenReturn(list);

        assertThat(service.getAll()).isSameAs(list);
        verify(repository).findAll();
    }

    @Test
    void getById_returnsNullWhenMissing() {
        when(repository.findById(9L)).thenReturn(Optional.empty());

        assertThat(service.getById(9L)).isNull();
    }

    @Test
    void create_saves() {
        PatientDoctorAssignment a = new PatientDoctorAssignment();
        when(repository.save(a)).thenReturn(a);

        assertThat(service.create(a)).isSameAs(a);
        verify(repository).save(a);
    }

    @Test
    void update_throwsWhenMissing() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(1L, new PatientDoctorAssignment()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Patient-doctor assignment not found");

        verify(repository, never()).save(any());
    }

    @Test
    void update_updatesFieldsAndSaves() {
        PatientDoctorAssignment existing = new PatientDoctorAssignment();
        existing.setId(1L);
        existing.setActive(true);

        Doctor doctor = new Doctor();
        doctor.setId(10L);
        Patient patient = new Patient();
        patient.setId(20L);

        PatientDoctorAssignment patch = new PatientDoctorAssignment();
        patch.setActive(false);
        patch.setDoctor(doctor);
        patch.setPatient(patient);

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        PatientDoctorAssignment saved = service.update(1L, patch);

        assertThat(saved).isSameAs(existing);
        assertThat(existing.getActive()).isFalse();
        assertThat(existing.getDoctor()).isSameAs(doctor);
        assertThat(existing.getPatient()).isSameAs(patient);
        verify(repository).save(existing);
    }

    @Test
    void delete_delegates() {
        service.delete(7L);
        verify(repository).deleteById(7L);
    }

    @Test
    void getByDoctorId_delegates() {
        List<PatientDoctorAssignment> list = List.of(new PatientDoctorAssignment());
        when(repository.findByDoctorId(123L)).thenReturn(list);

        assertThat(service.getByDoctorId(123L)).isSameAs(list);
        verify(repository).findByDoctorId(123L);
    }

    @Test
    void getByPatientId_delegates() {
        PatientDoctorAssignment assignment = new PatientDoctorAssignment();
        when(repository.findByPatientId(456L)).thenReturn(assignment);

        assertThat(service.getByPatientId(456L)).isSameAs(assignment);
        verify(repository).findByPatientId(456L);
    }
}
