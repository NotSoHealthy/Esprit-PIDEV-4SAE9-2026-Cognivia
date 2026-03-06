package com.pidev.pharmacy.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.pharmacy.entities.*;
import com.pidev.pharmacy.repositories.AgentLogRepository;
import com.pidev.pharmacy.repositories.MedicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentLogService {

    private final AgentLogRepository agentLogRepository;
    private final MedicationRepository medicationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public AgentLog logAction(AgentLogAction actionType, Medication medication, String reason) {
        AgentLog aLog = new AgentLog();
        aLog.setActionType(actionType);
        aLog.setMedicationName(medication.getName());
        aLog.setMedicationId(medication.getId());
        aLog.setReason(reason);
        
        // Store original data as JSON for undo
        try {
            MedicationSnapshot snapshot = new MedicationSnapshot(
                medication.getId(),
                medication.getName(),
                medication.getDescription(),
                medication.getTherapeuticClass(),
                medication.getMedicationStatus(),
                medication.getImageUrl()
            );
            aLog.setOriginalData(objectMapper.writeValueAsString(snapshot));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize medication data", e);
            aLog.setOriginalData("{}");
        }
        
        AgentLog savedLog = agentLogRepository.save(aLog);
        log.info("Agent aLog created: {} - {} ({})", actionType, medication.getName(), reason);
        return savedLog;
    }

    @Transactional(readOnly = true)
    public List<AgentLog> getAllLogs() {
        return agentLogRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional
    public Medication undoAction(Long logId) {
        AgentLog aLog = agentLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Agent aLog not found with id: " + logId));

        log.info("Attempting to undo action: {} for medication: {}", aLog.getActionType(), aLog.getMedicationName());

        try {
            MedicationSnapshot snapshot = objectMapper.readValue(aLog.getOriginalData(), MedicationSnapshot.class);

            switch (aLog.getActionType()) {
                case ACCEPTED:
                case MODIFIED:
                    // Change status back to PENDING and restore all original data
                    Medication medication = medicationRepository.findById(aLog.getMedicationId())
                            .orElseThrow(() -> new RuntimeException("Medication not found"));
                    medication.setMedicationStatus(MedicationStatus.PENDING);
                    
                    // Restore original data for both ACCEPTED and MODIFIED
                    medication.setName(snapshot.getName());
                    medication.setDescription(snapshot.getDescription());
                    medication.setTherapeuticClass(snapshot.getTherapeuticClass());
                    medication.setImageUrl(snapshot.getImageUrl()); // Always restore image

                    Medication restored = medicationRepository.save(medication);
                    agentLogRepository.delete(aLog);
                    log.info("Undo successful: Medication {} restored to PENDING (image: {})",
                            medication.getName(), snapshot.getImageUrl() != null ? "restored" : "none");
                    return restored;

                case REJECTED:
                case REVIEW_REJECTED:
                    // Recreate the medication
                    Medication recreated = new Medication();
                    recreated.setName(snapshot.getName());
                    recreated.setDescription(snapshot.getDescription());
                    recreated.setTherapeuticClass(snapshot.getTherapeuticClass());
                    recreated.setMedicationStatus(MedicationStatus.PENDING);
                    recreated.setImageUrl(snapshot.getImageUrl());
                    
                    Medication saved = medicationRepository.save(recreated);
                    agentLogRepository.delete(aLog);
                    log.info("Undo successful: Medication {} recreated", saved.getName());
                    return saved;

                default:
                    throw new RuntimeException("Cannot undo action type: " + aLog.getActionType());
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize medication data for undo", e);
            throw new RuntimeException("Failed to undo action: Invalid snapshot data", e);
        }
    }

    @Transactional
    public void deleteLog(Long logId) {
        AgentLog aLog = agentLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Agent log not found with id: " + logId));
        agentLogRepository.delete(aLog);
        log.info("Agent log deleted: {}", logId);
    }

    // Inner class for snapshot
    private static class MedicationSnapshot {
        private Long id;
        private String name;
        private String description;
        private TherapeuticClass therapeuticClass;
        private MedicationStatus medicationStatus;
        private String imageUrl;

        public MedicationSnapshot() {}

        public MedicationSnapshot(Long id, String name, String description, 
                                TherapeuticClass therapeuticClass, 
                                MedicationStatus medicationStatus, String imageUrl) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.therapeuticClass = therapeuticClass;
            this.medicationStatus = medicationStatus;
            this.imageUrl = imageUrl;
        }

        // Getters and setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public TherapeuticClass getTherapeuticClass() { return therapeuticClass; }
        public void setTherapeuticClass(TherapeuticClass therapeuticClass) { this.therapeuticClass = therapeuticClass; }
        public MedicationStatus getMedicationStatus() { return medicationStatus; }
        public void setMedicationStatus(MedicationStatus medicationStatus) { this.medicationStatus = medicationStatus; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    }
}
