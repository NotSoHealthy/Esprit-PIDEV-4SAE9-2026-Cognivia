package com.pidev.pharmacy.services;

import com.pidev.pharmacy.dto.PharmacyUpdateInfoDTO;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.repositories.InventoryTransactionRepository;
import com.pidev.pharmacy.repositories.MedicationStockRepository;
import com.pidev.pharmacy.repositories.PharmacistRepository;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import com.pidev.pharmacy.repositories.RatingRepository;
import com.pidev.pharmacy.repositories.ReportRepository;
import com.pidev.pharmacy.repositories.WorkingHoursRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyServiceTest {

    @Mock
    private PharmacyRepository pharmacyRepository;

    @Mock
    private ImgbbService imgbbService;

    @Mock
    private MedicationStockRepository medicationStockRepository;

    @Mock
    private WorkingHoursRepository workingHoursRepository;

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Mock
    private PharmacistRepository pharmacistRepository;

    @InjectMocks
    private PharmacyService pharmacyService;

    @Test
    void delete_shouldDeleteDependentsBeforePharmacy() {
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.setId(5L);

        when(pharmacyRepository.findById(5L)).thenReturn(Optional.of(pharmacy));

        pharmacyService.delete(5L);

        verify(inventoryTransactionRepository).deleteByPharmacyId(5L);
        verify(medicationStockRepository).deleteByPharmacyId(5L);
        verify(workingHoursRepository).deleteByPharmacyId(5L);
        verify(ratingRepository).deleteByPharmacyId(5L);
        verify(reportRepository).deleteByPharmacyId(5L);
        verify(pharmacistRepository).deleteByPharmacy_Id(5L);
        verify(pharmacyRepository).delete(pharmacy);
    }

    @Test
    void updatePharmacyInfo_shouldPatchOnlyProvidedFields() {
        Pharmacy existing = buildPharmacy(12L);
        PharmacyUpdateInfoDTO dto = new PharmacyUpdateInfoDTO();
        dto.setName("Updated Pharmacy");
        dto.setDescription("Updated pharmacy description");
        dto.setContactInfo("12345678");

        when(pharmacyRepository.findById(12L)).thenReturn(Optional.of(existing));
        when(pharmacyRepository.save(any(Pharmacy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Pharmacy updated = pharmacyService.updatePharmacyInfo(12L, dto);

        assertEquals("Updated Pharmacy", updated.getName());
        assertEquals("Somewhere Street", updated.getAddress());
        assertEquals("12345678", updated.getContactInfo());
    }

    private Pharmacy buildPharmacy(Long id) {
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.setId(id);
        pharmacy.setName("Initial Pharmacy");
        pharmacy.setAddress("Somewhere Street");
        pharmacy.setDescription("A local pharmacy description");
        pharmacy.setLatitude(36.80);
        pharmacy.setLongitude(10.17);
        pharmacy.setContactInfo("98765432");
        return pharmacy;
    }
}
