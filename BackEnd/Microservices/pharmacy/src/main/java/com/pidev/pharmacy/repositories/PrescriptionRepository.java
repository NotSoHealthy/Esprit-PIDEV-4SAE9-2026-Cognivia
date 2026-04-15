package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.MedicationStock;
import com.pidev.pharmacy.entities.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    List<Prescription> findByExpiresAtAfter(Instant now);   // active
    List<Prescription> findByExpiresAtBefore(Instant now);  // expired

    boolean existsByCode(String code);

    Optional<Prescription> findByCodeIgnoreCase(String code);

    List<Prescription> findTop10ByCodeContainingIgnoreCaseOrderByCreatedAtDesc(String code);

    List<Prescription> findByPatientNameContainingIgnoreCaseOrderByCreatedAtDesc(String patientName);
}