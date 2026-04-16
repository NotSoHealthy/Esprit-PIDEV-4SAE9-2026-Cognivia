package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.Prescription;
import com.pidev.pharmacy.entities.PrescriptionItem;
import com.pidev.pharmacy.repositories.MedicationRepository;
import com.pidev.pharmacy.repositories.MedicationStockRepository;
import com.pidev.pharmacy.repositories.PrescriptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionServiceTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private MedicationRepository medicationRepository;

    @Mock
    private MedicationStockRepository medicationStockRepository;

    @InjectMocks
    private PrescriptionService prescriptionService;

    @Test
    void create_shouldGenerateCodeSetCreatedAtAndSyncItems() {
        Prescription prescription = new Prescription();
        prescription.setId(77L);
        prescription.setPatientName("John Doe");
        prescription.setDoctorName("Dr Smith");
        prescription.setDescription("Pain treatment");
        prescription.setExpiresAt(Instant.now().plusSeconds(3600));

        Medication medication = new Medication();
        medication.setId(5L);

        PrescriptionItem item = new PrescriptionItem();
        item.setMedication(medication);
        item.setQuantity(2);

        prescription.setItems(new ArrayList<>(List.of(item)));

        when(prescriptionRepository.existsByCode(anyString())).thenReturn(false);
        when(prescriptionRepository.save(any(Prescription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Prescription created = prescriptionService.create(prescription);

        assertEquals(null, created.getId());
        assertNotNull(created.getCode());
        assertEquals(10, created.getCode().length());
        assertNotNull(created.getCreatedAt());
        assertSame(created, created.getItems().get(0).getPrescription());
    }

    @Test
    void addItem_shouldThrowWhenMedicationAlreadyExists() {
        Prescription prescription = new Prescription();
        prescription.setId(1L);

        Medication existingMedication = new Medication();
        existingMedication.setId(10L);

        PrescriptionItem existingItem = new PrescriptionItem();
        existingItem.setMedication(existingMedication);

        prescription.setItems(new ArrayList<>(List.of(existingItem)));

        Medication requestedMedication = new Medication();
        requestedMedication.setId(10L);

        when(prescriptionRepository.findById(1L)).thenReturn(Optional.of(prescription));
        when(medicationRepository.findById(10L)).thenReturn(Optional.of(requestedMedication));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> prescriptionService.addItem(1L, 10L, 1, "ONCE_DAILY"));

        assertEquals("Medication already exists in this prescription", ex.getMessage());
    }

    @Test
    void getVisibleByPatientNameMentions_shouldMergeDistinctResultsById() {
        Prescription p1 = new Prescription();
        p1.setId(1L);

        Prescription p2 = new Prescription();
        p2.setId(2L);

        when(prescriptionRepository.findByPatientNameContainingIgnoreCaseOrderByCreatedAtDesc("john"))
                .thenReturn(List.of(p1, p2));
        when(prescriptionRepository.findByPatientNameContainingIgnoreCaseOrderByCreatedAtDesc("doe"))
                .thenReturn(List.of(p2));

        List<Prescription> visible = prescriptionService.getVisibleByPatientNameMentions(List.of("john", "doe"));

        assertEquals(2, visible.size());
        assertEquals(1L, visible.get(0).getId());
        assertEquals(2L, visible.get(1).getId());
        verify(prescriptionRepository).findByPatientNameContainingIgnoreCaseOrderByCreatedAtDesc("john");
        verify(prescriptionRepository).findByPatientNameContainingIgnoreCaseOrderByCreatedAtDesc("doe");
    }
}
