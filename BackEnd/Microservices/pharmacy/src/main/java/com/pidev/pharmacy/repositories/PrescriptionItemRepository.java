package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, Long> {

    List<PrescriptionItem> findByPrescriptionId(Long prescriptionId);

    List<PrescriptionItem> findByMedicationId(Long medicationId);

    List<PrescriptionItem> findByPrescriptionIdAndMedicationId(Long prescriptionId, Long medicationId);
}