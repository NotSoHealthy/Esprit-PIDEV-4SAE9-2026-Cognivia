package com.pidev.care.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pidev.care.dto.DoctorDto;
import com.pidev.care.entities.Doctor;
import com.pidev.care.services.DoctorService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DoctorControllerTest {

    @Mock
    private DoctorService doctorService;

    private DoctorController controller;

    @BeforeEach
    void setUp() {
        controller = new DoctorController(doctorService);
    }

    @Test
    void getAllDoctors_delegatesToService() {
        List<Doctor> doctors = List.of(new Doctor());
        when(doctorService.getAll()).thenReturn(doctors);

        assertThat(controller.getAllDoctors()).isSameAs(doctors);
    }

    @Test
    void getDoctorById_delegatesToService() {
        Doctor doctor = new Doctor();
        when(doctorService.getById(1L)).thenReturn(doctor);

        assertThat(controller.getDoctorById(1L)).isSameAs(doctor);
    }

    @Test
    void getDoctorDtoById_mapsViaDto() {
        Doctor doctor = new Doctor();
        doctor.setId(3L);
        doctor.setUserId(UUID.randomUUID());
        doctor.setFirstName("F");
        doctor.setLastName("L");
        doctor.setSpecialty("Cardio");
        doctor.setLicenseNumber("LIC");
        when(doctorService.getById(3L)).thenReturn(doctor);

        DoctorDto dto = controller.getDoctorDtoById(3L);
        assertThat(dto.getId()).isEqualTo(3L);
        assertThat(dto.getSpecialty()).isEqualTo("Cardio");
    }

    @Test
    void getDoctorByUserId_delegatesToService() {
        UUID userId = UUID.randomUUID();
        Doctor doctor = new Doctor();
        when(doctorService.getByUserId(userId)).thenReturn(doctor);

        assertThat(controller.getDoctorByUserId(userId)).isSameAs(doctor);
    }

    @Test
    void createDoctor_delegatesToService() {
        Doctor input = new Doctor();
        Doctor created = new Doctor();
        when(doctorService.create(input)).thenReturn(created);

        assertThat(controller.createDoctor(input)).isSameAs(created);
    }

    @Test
    void registerDoctor_setsUserIdBeforeCreate() {
        UUID userId = UUID.randomUUID();
        Doctor toCreate = new Doctor();
        when(doctorService.create(any(Doctor.class))).thenAnswer(inv -> inv.getArgument(0));

        Doctor created = controller.registerDoctor(userId, toCreate);
        assertThat(created.getUserId()).isEqualTo(userId);

        ArgumentCaptor<Doctor> captor = ArgumentCaptor.forClass(Doctor.class);
        verify(doctorService).create(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
    }

    @Test
    void updateDoctor_delegatesToService() {
        Doctor patch = new Doctor();
        Doctor updated = new Doctor();
        when(doctorService.update(2L, patch)).thenReturn(updated);

        assertThat(controller.updateDoctor(2L, patch)).isSameAs(updated);
    }

    @Test
    void deleteDoctor_delegatesToService() {
        controller.deleteDoctor(8L);
        verify(doctorService).delete(8L);
    }
}
