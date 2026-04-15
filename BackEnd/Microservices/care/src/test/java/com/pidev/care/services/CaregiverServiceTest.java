package com.pidev.care.services;

import com.pidev.care.entities.Caregiver;
import com.pidev.care.entities.CaregiverType;
import com.pidev.care.repositories.CaregiverRepository;
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
class CaregiverServiceTest {

    @Mock
    private CaregiverRepository caregiverRepository;

    @InjectMocks
    private CaregiverService caregiverService;

    @Test
    void getAll_delegates() {
        List<Caregiver> caregivers = List.of(new Caregiver());
        when(caregiverRepository.findAll()).thenReturn(caregivers);

        assertThat(caregiverService.getAll()).isSameAs(caregivers);
        verify(caregiverRepository).findAll();
    }

    @Test
    void getById_returnsNullWhenMissing() {
        when(caregiverRepository.findById(9L)).thenReturn(Optional.empty());

        assertThat(caregiverService.getById(9L)).isNull();
    }

    @Test
    void create_saves() {
        Caregiver caregiver = new Caregiver();
        when(caregiverRepository.save(caregiver)).thenReturn(caregiver);

        assertThat(caregiverService.create(caregiver)).isSameAs(caregiver);
        verify(caregiverRepository).save(caregiver);
    }

    @Test
    void update_throwsWhenMissing() {
        when(caregiverRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> caregiverService.update(1L, new Caregiver()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Caregiver not found");

        verify(caregiverRepository, never()).save(any());
    }

    @Test
    void update_updatesFieldsAndSaves() {
        Caregiver existing = new Caregiver();
        existing.setId(1L);
        existing.setFirstName("A");
        existing.setLastName("B");
        existing.setType(CaregiverType.FAMILY);

        Caregiver patch = new Caregiver();
        patch.setFirstName("NewA");
        patch.setLastName("NewB");
        patch.setType(CaregiverType.PROFESSIONAL);

        when(caregiverRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(caregiverRepository.save(existing)).thenReturn(existing);

        Caregiver saved = caregiverService.update(1L, patch);

        assertThat(saved).isSameAs(existing);
        assertThat(existing.getFirstName()).isEqualTo("NewA");
        assertThat(existing.getLastName()).isEqualTo("NewB");
        assertThat(existing.getType()).isEqualTo(CaregiverType.PROFESSIONAL);
        verify(caregiverRepository).save(existing);
    }

    @Test
    void delete_delegates() {
        caregiverService.delete(7L);
        verify(caregiverRepository).deleteById(7L);
    }

    @Test
    void getByUserId_returnsNullWhenNone() {
        UUID userId = UUID.randomUUID();
        when(caregiverRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThat(caregiverService.getByUserId(userId)).isNull();
    }

    @Test
    void getByUserId_returnsDetachedCopy() {
        UUID userId = UUID.randomUUID();
        Caregiver stored = new Caregiver();
        stored.setId(1L);
        stored.setUserId(userId);
        stored.setFirstName("F");
        stored.setLastName("L");
        stored.setType(CaregiverType.FAMILY);

        when(caregiverRepository.findByUserId(userId)).thenReturn(Optional.of(stored));

        Caregiver result = caregiverService.getByUserId(userId);

        assertThat(result).isNotNull();
        assertThat(result).isNotSameAs(stored);
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getFirstName()).isEqualTo("F");
        assertThat(result.getLastName()).isEqualTo("L");
        assertThat(result.getType()).isEqualTo(CaregiverType.FAMILY);
    }
}
