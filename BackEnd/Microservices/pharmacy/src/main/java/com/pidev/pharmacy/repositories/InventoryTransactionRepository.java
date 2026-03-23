package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByPharmacyId(Long pharmacyId);

    long deleteByPharmacyId(Long pharmacyId);

    List<InventoryTransaction> findByMedicationId(Long medicationId);

    List<InventoryTransaction> findByPharmacyIdAndMedicationId(Long pharmacyId, Long medicationId);

    List<InventoryTransaction> findByTransactionAtBetween(Instant start, Instant end);
}

