package com.pidev.care.services;

import com.pidev.care.entities.Doctor;
import com.pidev.care.repositories.DoctorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DoctorService doctorService;

    @Test
    void getAll_delegates() {
        List<Doctor> doctors = List.of(new Doctor());
        when(doctorRepository.findAll()).thenReturn(doctors);

        assertThat(doctorService.getAll()).isSameAs(doctors);
        verify(doctorRepository).findAll();
    }

    @Test
    void getById_returnsNullWhenMissing() {
        when(doctorRepository.findById(9L)).thenReturn(Optional.empty());

        assertThat(doctorService.getById(9L)).isNull();
    }

    @Test
    void create_saves() {
        Doctor doctor = new Doctor();
        when(doctorRepository.save(doctor)).thenReturn(doctor);

        assertThat(doctorService.create(doctor)).isSameAs(doctor);
        verify(doctorRepository).save(doctor);
    }

    @Test
    void update_throwsWhenMissing() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> doctorService.update(1L, new Doctor()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Doctor not found");

        verify(doctorRepository, never()).save(any());
    }

    @Test
    void update_updatesFieldsAndSaves() {
        Doctor existing = new Doctor();
        existing.setId(1L);
        existing.setFirstName("A");
        existing.setLastName("B");
        existing.setSpecialty("Old");
        existing.setLicenseNumber("L1");

        Doctor patch = new Doctor();
        patch.setFirstName("NewA");
        patch.setLastName("NewB");
        patch.setSpecialty("NewSpec");
        patch.setLicenseNumber("L2");

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(doctorRepository.save(existing)).thenReturn(existing);

        Doctor saved = doctorService.update(1L, patch);

        assertThat(saved).isSameAs(existing);
        assertThat(existing.getFirstName()).isEqualTo("NewA");
        assertThat(existing.getLastName()).isEqualTo("NewB");
        assertThat(existing.getSpecialty()).isEqualTo("NewSpec");
        assertThat(existing.getLicenseNumber()).isEqualTo("L2");
        verify(doctorRepository).save(existing);
    }

    @Test
    void delete_delegates() {
        doctorService.delete(7L);
        verify(doctorRepository).deleteById(7L);
    }

    @Test
    void getByUserId_returnsNullWhenNone() {
        UUID userId = UUID.randomUUID();
        when(doctorRepository.findByUserId(userId)).thenReturn(List.of());

        assertThat(doctorService.getByUserId(userId)).isNull();
    }

    @Test
    void getByUserId_returnsDetachedCopy() {
        UUID userId = UUID.randomUUID();
        Doctor stored = new Doctor();
        stored.setId(1L);
        stored.setUserId(userId);
        stored.setFirstName("F");
        stored.setLastName("L");
        stored.setSpecialty("Cardio");
        stored.setLicenseNumber("LIC");

        when(doctorRepository.findByUserId(userId)).thenReturn(List.of(stored));

        Doctor result = doctorService.getByUserId(userId);

        assertThat(result).isNotNull();
        assertThat(result).isNotSameAs(stored);
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getFirstName()).isEqualTo("F");
        assertThat(result.getLastName()).isEqualTo("L");
        assertThat(result.getSpecialty()).isEqualTo("Cardio");
        assertThat(result.getLicenseNumber()).isEqualTo("LIC");
    }
}
