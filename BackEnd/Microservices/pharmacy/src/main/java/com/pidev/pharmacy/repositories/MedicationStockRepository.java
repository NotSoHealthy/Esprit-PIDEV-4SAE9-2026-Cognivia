package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.MedicationStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicationStockRepository extends JpaRepository<MedicationStock, Long> {

    List<MedicationStock> findByPharmacyId(Long pharmacyId);

    List<MedicationStock> findByMedicationId(Long medicationId);

    Optional<MedicationStock> findByPharmacyIdAndMedicationId(Long pharmacyId, Long medicationId);
}