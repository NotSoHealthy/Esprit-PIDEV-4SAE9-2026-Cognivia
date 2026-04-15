package com.pidev.care.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pidev.care.dto.CaregiverDto;
import com.pidev.care.entities.Caregiver;
import com.pidev.care.entities.CaregiverType;
import com.pidev.care.services.CaregiverService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CaregiverControllerTest {

    @Mock
    private CaregiverService caregiverService;

    private CaregiverController controller;

    @BeforeEach
    void setUp() {
        controller = new CaregiverController(caregiverService);
    }

    @Test
    void getAllCaregivers_delegatesToService() {
        List<Caregiver> caregivers = List.of(new Caregiver(), new Caregiver());
        when(caregiverService.getAll()).thenReturn(caregivers);

        assertThat(controller.getAllCaregivers()).isSameAs(caregivers);
    }

    @Test
    void getCaregiverById_delegatesToService() {
        Caregiver caregiver = new Caregiver();
        when(caregiverService.getById(5L)).thenReturn(caregiver);

        assertThat(controller.getCaregiverById(5L)).isSameAs(caregiver);
    }

    @Test
    void getCaregiverDtoById_mapsViaDto() {
        Caregiver caregiver = new Caregiver();
        caregiver.setId(7L);
        caregiver.setUserId(UUID.randomUUID());
        caregiver.setFirstName("A");
        caregiver.setLastName("B");
        caregiver.setType(CaregiverType.PROFESSIONAL);
        when(caregiverService.getById(7L)).thenReturn(caregiver);

        CaregiverDto dto = controller.getCaregiverDtoById(7L);
        assertThat(dto.getId()).isEqualTo(7L);
        assertThat(dto.getType()).isEqualTo("PROFESSIONAL");
    }

    @Test
    void getCaregiverByUserId_delegatesToService() {
        UUID userId = UUID.randomUUID();
        Caregiver caregiver = new Caregiver();
        when(caregiverService.getByUserId(userId)).thenReturn(caregiver);

        assertThat(controller.getCaregiverByUserId(userId)).isSameAs(caregiver);
    }

    @Test
    void createCaregiver_delegatesToService() {
        Caregiver input = new Caregiver();
        Caregiver created = new Caregiver();
        when(caregiverService.create(input)).thenReturn(created);

        assertThat(controller.createCaregiver(input)).isSameAs(created);
    }

    @Test
    void registerCaregiver_setsUserIdBeforeCreate() {
        UUID userId = UUID.randomUUID();
        Caregiver toCreate = new Caregiver();
        when(caregiverService.create(any(Caregiver.class))).thenAnswer(inv -> inv.getArgument(0));

        Caregiver created = controller.registerCaregiver(userId, toCreate);
        assertThat(created.getUserId()).isEqualTo(userId);

        ArgumentCaptor<Caregiver> captor = ArgumentCaptor.forClass(Caregiver.class);
        verify(caregiverService).create(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
    }

    @Test
    void updateCaregiver_delegatesToService() {
        Caregiver patch = new Caregiver();
        Caregiver updated = new Caregiver();
        when(caregiverService.update(9L, patch)).thenReturn(updated);

        assertThat(controller.updateCaregiver(9L, patch)).isSameAs(updated);
    }

    @Test
    void deleteCaregiver_delegatesToService() {
        controller.deleteCaregiver(11L);
        verify(caregiverService).delete(11L);
    }
}
