package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.MedicationStock;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.entities.RestockNotificationSubscription;
import com.pidev.pharmacy.rabbitMQ.EventPublisher;
import com.pidev.pharmacy.repositories.MedicationRepository;
import com.pidev.pharmacy.repositories.MedicationStockRepository;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import com.pidev.pharmacy.repositories.RestockNotificationSubscriptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicationStockServiceTest {

    @Mock
    private MedicationStockRepository medicationStockRepository;

    @Mock
    private PharmacyRepository pharmacyRepository;

    @Mock
    private MedicationRepository medicationRepository;

    @Mock
    private RestockNotificationSubscriptionRepository restockSubscriptionRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private MedicationStockService medicationStockService;

    @Test
    void create_shouldAttachManagedPharmacyAndMedication() {
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.setId(2L);

        Medication medication = new Medication();
        medication.setId(3L);

        MedicationStock stock = new MedicationStock();
        stock.setId(40L);
        stock.setQuantity(10);
        stock.setPharmacy(pharmacy);
        stock.setMedication(medication);

        when(pharmacyRepository.findById(2L)).thenReturn(Optional.of(pharmacy));
        when(medicationRepository.findById(3L)).thenReturn(Optional.of(medication));
        when(medicationStockRepository.save(any(MedicationStock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MedicationStock created = medicationStockService.create(stock);

        assertEquals(null, created.getId());
        assertEquals(2L, created.getPharmacy().getId());
        assertEquals(3L, created.getMedication().getId());
    }

    @Test
    void subscribeToRestock_shouldThrowWhenUsernameMissing() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> medicationStockService.subscribeToRestock(1L, "u-1", "   "));

        assertEquals("Missing username", ex.getMessage());
    }

    @Test
    void updateQuantity_shouldPublishRestockEventAndDeleteSubscriptions() {
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.setId(11L);
        pharmacy.setName("Central Pharmacy");

        Medication medication = new Medication();
        medication.setId(22L);
        medication.setName("Ibuprofen");

        MedicationStock stock = new MedicationStock();
        stock.setId(100L);
        stock.setQuantity(0);
        stock.setPharmacy(pharmacy);
        stock.setMedication(medication);

        RestockNotificationSubscription subscription = new RestockNotificationSubscription();
        subscription.setUserId("user-1");

        when(pharmacyRepository.findById(11L)).thenReturn(Optional.of(pharmacy));
        when(medicationRepository.findById(22L)).thenReturn(Optional.of(medication));
        when(medicationStockRepository.findByPharmacyIdAndMedicationId(11L, 22L)).thenReturn(Optional.of(stock));
        when(medicationStockRepository.save(any(MedicationStock.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(restockSubscriptionRepository.findByMedicationStockId(100L)).thenReturn(List.of(subscription));
        when(eventPublisher.sendGenericEvent(any(), any())).thenReturn(true);

        MedicationStock updated = medicationStockService.updateQuantity(11L, 22L, 5);

        assertNotNull(updated);
        assertEquals(5, updated.getQuantity());
        verify(eventPublisher).sendGenericEvent(any(), any());
        verify(restockSubscriptionRepository).deleteByMedicationStockId(100L);
    }

    @Test
    void subscribeToRestock_shouldReturnFalseWhenAlreadySubscribed() {
        MedicationStock stock = new MedicationStock();
        stock.setId(13L);
        stock.setQuantity(0);

        when(medicationStockRepository.findById(13L)).thenReturn(Optional.of(stock));
        when(restockSubscriptionRepository.existsByMedicationStockIdAndUserId(13L, "u-13")).thenReturn(true);

        boolean created = medicationStockService.subscribeToRestock(13L, " u-13 ", "  testUser  ");

        assertFalse(created);
    }
}
