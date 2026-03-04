package com.pidev.care.repositories;

import com.pidev.care.entities.Patient;
import com.pidev.care.entities.Severity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
   

    List<Patient> findAllByUserId(UUID userId);
    List<Patient> findByUserId(UUID userId);

    List<Patient> findBySeverity(Severity severity);
}
