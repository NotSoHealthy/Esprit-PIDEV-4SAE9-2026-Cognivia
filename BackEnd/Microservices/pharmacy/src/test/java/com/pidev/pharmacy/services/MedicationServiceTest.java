package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.MedicationStatus;
import com.pidev.pharmacy.entities.TherapeuticClass;
import com.pidev.pharmacy.repositories.MedicationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicationServiceTest {

    @Mock
    private MedicationRepository medicationRepository;

    @Mock
    private ImgbbService imgbbService;

    @Mock
    private AgentMessageService agentMessageService;

    @InjectMocks
    private MedicationService medicationService;

    @Test
    void create_shouldResetIdAndSave() {
        Medication medication = buildMedication(99L);

        when(medicationRepository.save(any(Medication.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Medication result = medicationService.create(medication);

        assertEquals(null, result.getId());
        assertEquals("Paracetamol", result.getName());
        verify(medicationRepository).save(medication);
    }

    @Test
    void update_shouldPatchOnlyProvidedFields() {
        Medication existing = buildMedication(1L);
        Medication patch = new Medication();
        patch.setDescription("Updated description");

        when(medicationRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(medicationRepository.save(any(Medication.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Medication result = medicationService.update(1L, patch);

        assertEquals(1L, result.getId());
        assertEquals("Paracetamol", result.getName());
        assertEquals("Updated description", result.getDescription());
        assertEquals(TherapeuticClass.NMDA_RECEPTOR_ANTAGONIST, result.getTherapeuticClass());
    }

    @Test
    void patchAndAcceptMedication_shouldApplyAgentChangesAndMarkAccepted() {
        Medication existing = buildMedication(7L);
        existing.setMedicationStatus(MedicationStatus.PENDING);

        when(medicationRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(medicationRepository.save(any(Medication.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Medication result = medicationService.patchAndAcceptMedication(7L);

        assertNotNull(result);
        assertEquals(MedicationStatus.ACCEPTED, result.getMedicationStatus());
        verify(agentMessageService).applyModificationsFromMessage(existing);
        verify(medicationRepository).save(existing);
    }

    private Medication buildMedication(Long id) {
        Medication medication = new Medication();
        medication.setId(id);
        medication.setName("Paracetamol");
        medication.setDescription("Pain relief tablet");
        medication.setTherapeuticClass(TherapeuticClass.NMDA_RECEPTOR_ANTAGONIST);
        medication.setMedicationStatus(MedicationStatus.PENDING);
        return medication;
    }
}
