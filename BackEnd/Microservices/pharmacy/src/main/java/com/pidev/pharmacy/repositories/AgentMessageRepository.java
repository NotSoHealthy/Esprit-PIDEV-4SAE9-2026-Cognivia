package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.AgentMessage;
import com.pidev.pharmacy.entities.Medication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AgentMessageRepository extends JpaRepository<AgentMessage, Long> {
    List<AgentMessage> findByMedication(Medication medication);
    Optional<AgentMessage> findByMedicationId(Long medicationId);
    List<AgentMessage> findByMedicationMedicationStatus(com.pidev.pharmacy.entities.MedicationStatus status);
}
