package com.pidev.care.repositories;

import com.pidev.care.entities.Patient;
import com.pidev.care.entities.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    List<Patient> findByUserId(UUID userId);

    List<Patient> findBySeverity(Severity severity);
}
