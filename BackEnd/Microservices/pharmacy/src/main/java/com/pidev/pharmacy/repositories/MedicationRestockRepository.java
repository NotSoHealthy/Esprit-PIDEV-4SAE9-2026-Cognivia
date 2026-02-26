package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.MedicationRestock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MedicationRestockRepository extends JpaRepository<MedicationRestock, Long> {

    List<MedicationRestock> findByPharmacyId(Long pharmacyId);

    List<MedicationRestock> findByMedicationId(Long medicationId);

    List<MedicationRestock> findByPharmacyIdAndMedicationId(Long pharmacyId, Long medicationId);

    List<MedicationRestock> findByRestockAtBetween(Instant start, Instant end);
}