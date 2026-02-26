package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.Pharmacy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByNameContainingIgnoreCase(String name);
    Optional<Medication> findByNameIgnoreCase(String name);
}