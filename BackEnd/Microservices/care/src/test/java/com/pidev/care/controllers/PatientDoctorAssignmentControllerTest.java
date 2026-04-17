package com.pidev.care.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pidev.care.entities.PatientDoctorAssignment;
import com.pidev.care.services.PatientDoctorAssignmentService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PatientDoctorAssignmentControllerTest {

    @Mock
    private PatientDoctorAssignmentService patientDoctorAssignmentService;

    private PatientDoctorAssignmentController controller;

    @BeforeEach
    void setUp() {
        controller = new PatientDoctorAssignmentController(patientDoctorAssignmentService);
    }

    @Test
    void getAllPatientDoctorAssignments_delegatesToService() {
        List<PatientDoctorAssignment> list = List.of(new PatientDoctorAssignment());
        when(patientDoctorAssignmentService.getAll()).thenReturn(list);

        assertThat(controller.getAllPatientDoctorAssignments()).isSameAs(list);
    }

    @Test
    void getPatientDoctorAssignmentById_delegatesToService() {
        PatientDoctorAssignment a = new PatientDoctorAssignment();
        when(patientDoctorAssignmentService.getById(1L)).thenReturn(a);

        assertThat(controller.getPatientDoctorAssignmentById(1L)).isSameAs(a);
    }

    @Test
    void createPatientDoctorAssignment_delegatesToService() {
        PatientDoctorAssignment input = new PatientDoctorAssignment();
        PatientDoctorAssignment created = new PatientDoctorAssignment();
        when(patientDoctorAssignmentService.create(input)).thenReturn(created);

        assertThat(controller.createPatientDoctorAssignment(input)).isSameAs(created);
    }

    @Test
    void updatePatientDoctorAssignment_delegatesToService() {
        PatientDoctorAssignment patch = new PatientDoctorAssignment();
        PatientDoctorAssignment updated = new PatientDoctorAssignment();
        when(patientDoctorAssignmentService.update(2L, patch)).thenReturn(updated);

        assertThat(controller.updatePatientDoctorAssignment(2L, patch)).isSameAs(updated);
    }

    @Test
    void deletePatientDoctorAssignment_delegatesToService() {
        controller.deletePatientDoctorAssignment(3L);
        verify(patientDoctorAssignmentService).delete(3L);
    }

    @Test
    void getByPatientId_delegatesToService() {
        PatientDoctorAssignment assignment = new PatientDoctorAssignment();
        when(patientDoctorAssignmentService.getByPatientId(10L)).thenReturn(assignment);

        assertThat(controller.getByPatientId(10L)).isSameAs(assignment);
    }
}
