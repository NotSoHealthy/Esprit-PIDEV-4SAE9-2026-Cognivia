package com.pidev.pharmacy.services;

import com.pidev.pharmacy.config.AgentModeConfig;
import com.pidev.pharmacy.entities.*;
import com.pidev.pharmacy.repositories.AgentMessageRepository;
import com.pidev.pharmacy.repositories.MedicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentMessageService {

    private final AgentMessageRepository agentMessageRepository;
    private final MedicationRepository medicationRepository;
    private final DeepSeekService deepSeekService;
    private final AgentModeConfig agentModeConfig;
    private final AgentLogService agentLogService;

    @Async
    @Transactional
    public void analyzeMedicationRequestAsync(Long medicationId) {
        try {
            log.info("Starting async AI analysis for medication ID: {}", medicationId);
            
            Medication medication = medicationRepository.findById(medicationId)
                    .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));
            
            log.info("🔍 Fetched medication for async analysis: {} (ID: {}, ImageUrl: {})", 
                medication.getName(), medication.getId(), medication.getImageUrl());
            
            analyzeMedicationRequest(medication);
        } catch (Exception e) {
            log.error("Async AI analysis failed for medication id {}: {}", medicationId, e.getMessage(), e);
        }
    }

    @Transactional
    public AgentMessage analyzeMedicationRequest(Medication medication) {
        log.info("Starting AI analysis for medication: {} (ID: {}, Status: {}, ImageUrl: {})", 
            medication.getName(), medication.getId(), medication.getMedicationStatus(), medication.getImageUrl());
        
        try {
            // Perform comprehensive validation
            AgentMessage message = deepSeekService.validateMedicationComprehensive(medication);
            message.setMedication(medication);
            
            log.info("Analysis complete for medication: {}. Action: {}", medication.getName(), message.getActionType());
            AgentMessage savedMessage = agentMessageRepository.save(message);
            
            // If agent mode is enabled, automatically execute the recommended action
            if (agentModeConfig.isAgentModeEnabled()) {
                log.info("Agent mode is ON. Executing automatic action: {}", message.getActionType());
                // Re-fetch medication from DB to ensure we have latest state (e.g., uploaded images)
                Medication latestMedication = medicationRepository.findById(medication.getId())
                        .orElse(medication);
                log.info("🔄 Re-fetched medication before action: {} (ID: {}, ImageUrl: {})", 
                    latestMedication.getName(), latestMedication.getId(), latestMedication.getImageUrl());
                executeAutomaticAction(latestMedication, message);
            } else {
                log.info("Agent mode is OFF. Action will require manual review.");
            }
            
            return savedMessage;
            
        } catch (Exception e) {
            log.error("Error during AI analysis for medication {}: {}", medication.getName(), e.getMessage(), e);
            
            // Create error message
            AgentMessage errorMessage = new AgentMessage();
            errorMessage.setMedication(medication);
            errorMessage.setContent("❌ Error during analysis: " + e.getMessage() + "\nManual review is required.");
            errorMessage.setActionType(AgentActionType.REVIEW_REQUIRED);
            errorMessage.setRawAnalysisData("ERROR: " + e.getMessage());
            
            return agentMessageRepository.save(errorMessage);
        }
    }

    private void executeAutomaticAction(Medication medication, AgentMessage message) {
        try {
            switch (message.getActionType()) {
                case ACCEPT:
                    // Log action BEFORE modifying (captures original state)
                    agentLogService.logAction(AgentLogAction.ACCEPTED, medication, message.getContent());

                    // Modify status to ACCEPTED
                    medication.setMedicationStatus(MedicationStatus.ACCEPTED);
                    medicationRepository.save(medication);
                    log.info("Agent automatically ACCEPTED medication: {}", medication.getName());
                    break;

                case DELETE:
                    // Log action BEFORE deleting (captures original state)
                    agentLogService.logAction(AgentLogAction.REJECTED, medication, message.getContent());
                    medicationRepository.delete(medication);
                    log.info("Agent automatically REJECTED (deleted) medication: {}", medication.getName());
                    break;

                case PATCH_AND_ACCEPT:
                    log.info("🔧 Processing PATCH_AND_ACCEPT for medication: {} (Initial ImageUrl: {})", 
                        medication.getName(), medication.getImageUrl());
                    
                    // Log action BEFORE modifying (captures original state with imageUrl)
                    agentLogService.logAction(AgentLogAction.MODIFIED, medication, message.getContent());

                    // Preserve the image URL
                    String originalImageUrl = medication.getImageUrl();
                    log.info("📸 Saved original image URL for restoration: {}", originalImageUrl);

                    // Apply suggested modifications from AI
                    applySuggestedModifications(medication, message);
                    log.info("✏️ Applied AI suggestions. New state - Description: {}, Class: {}", 
                        medication.getDescription(), medication.getTherapeuticClass());
                    
                    medication.setMedicationStatus(MedicationStatus.ACCEPTED);
                    medication.setImageUrl(originalImageUrl); // Restore image after AI modifications
                    log.info("🔄 Restored image URL to: {}", medication.getImageUrl());

                    Medication savedMed = medicationRepository.save(medication);
                    log.info("✅ Agent automatically MODIFIED and ACCEPTED medication: {} (Image URL in DB: {})",
                            medication.getName(), savedMed.getImageUrl());
                    break;

                case REVIEW_REQUIRED:
                    // Check if auto-delete review required is enabled
                    if (agentModeConfig.isAutoDeleteReviewRequired()) {
                        agentLogService.logAction(AgentLogAction.REVIEW_REJECTED, medication, message.getContent());
                        medicationRepository.delete(medication);
                        log.info("Agent automatically DELETED review-required medication: {}", medication.getName());
                    } else {
                        log.info("Review required for medication: {}. No automatic action taken.", medication.getName());
                    }
                    break;

                default:
                    log.warn("Unknown action type: {}", message.getActionType());
            }
        } catch (Exception e) {
            log.error("Failed to execute automatic action for medication {}: {}", medication.getName(), e.getMessage(), e);
        }
    }

    /**
     * Public method to apply AI suggested modifications to a medication
     * Used when manually patching and accepting a medication
     */
    public void applyModificationsFromMessage(Medication medication) {
        AgentMessage message = agentMessageRepository.findByMedicationId(medication.getId())
                .orElseThrow(() -> new RuntimeException("No agent message found for medication: " + medication.getName()));
        
        applySuggestedModifications(medication, message);
        
        // Create agent log for the manual patch and accept action
        agentLogService.logAction(AgentLogAction.MODIFIED, medication,
                "Manually patched with AI suggestions: " + message.getContent());
    }

    private void applySuggestedModifications(Medication medication, AgentMessage message) {
        try {
            String rawData = message.getRawAnalysisData();
            if (rawData == null || rawData.isEmpty()) {
                log.warn("No raw analysis data available for medication: {}", medication.getName());
                return;
            }

            log.debug("Raw analysis data for {}: {}", medication.getName(), rawData);

            // Parse combined STEP 4 & 5 from rawAnalysisData
            String[] steps = rawData.split("STEP ");
            boolean descriptionApplied = false;
            boolean classApplied = false;

            for (String step : steps) {
                if (step.startsWith("4 & 5 - Description & Class Check:")) {
                    log.debug("Found STEP 4 & 5 section for medication: {}", medication.getName());
                    
                    // Extract JSON more robustly - find the first { and last }
                    int jsonStart = step.indexOf("{");
                    int jsonEnd = step.lastIndexOf("}");
                    
                    if (jsonStart >= 0 && jsonEnd > jsonStart) {
                        String jsonPart = step.substring(jsonStart, jsonEnd + 1);
                        log.debug("Extracted JSON for {}: {}", medication.getName(), jsonPart);
                        
                        try {
                            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(jsonPart);
                            
                            log.debug("Parsed JSON node. Fields: {}", node.fieldNames());
                            
                            // Apply description if suggested
                            if (node.has("suggestedDescription")) {
                                String suggested = node.get("suggestedDescription").asText();
                                log.debug("suggestedDescription field value: '{}'", suggested);
                                
                                if (suggested != null && !suggested.trim().isEmpty() && !"null".equalsIgnoreCase(suggested.trim())) {
                                    medication.setDescription(suggested.trim());
                                    log.info("✅ Applied suggested description for medication {}: {}", medication.getName(), suggested);
                                    descriptionApplied = true;
                                } else {
                                    log.debug("suggestedDescription was empty or null, skipping");
                                }
                            } else {
                                log.debug("No 'suggestedDescription' field in JSON");
                            }
                            
                            // Apply therapeutic class if suggested
                            if (node.has("suggestedClass")) {
                                String suggested = node.get("suggestedClass").asText();
                                log.debug("suggestedClass field value: '{}'", suggested);
                                
                                if (suggested != null && !suggested.trim().isEmpty() && !"null".equalsIgnoreCase(suggested.trim())) {
                                    String normalized = suggested.trim().toUpperCase();
                                    log.debug("Normalized class value: '{}'", normalized);
                                    
                                    try {
                                        TherapeuticClass therapeuticClass = TherapeuticClass.valueOf(normalized);
                                        medication.setTherapeuticClass(therapeuticClass);
                                        log.info("✅ Applied suggested therapeutic class for medication {}: {}", medication.getName(), therapeuticClass);
                                        classApplied = true;
                                    } catch (IllegalArgumentException e) {
                                        log.warn("Invalid therapeutic class suggestion '{}' for {}: {}", normalized, medication.getName(), e.getMessage());
                                    }
                                } else {
                                    log.debug("suggestedClass was empty or null, skipping");
                                }
                            } else {
                                log.debug("No 'suggestedClass' field in JSON");
                            }
                        } catch (Exception e) {
                            log.error("Failed to parse combined suggestions for {}: {}", medication.getName(), e.getMessage(), e);
                        }
                    } else {
                        log.warn("Could not find JSON in STEP 4 & 5 section. jsonStart={}, jsonEnd={}", jsonStart, jsonEnd);
                    }
                }
            }

            if (descriptionApplied || classApplied) {
                log.info("Applied modifications to medication {}: description={}, class={}", 
                    medication.getName(), descriptionApplied, classApplied);
            } else {
                log.debug("No modifications were applied for medication: {}", medication.getName());
            }
        } catch (Exception e) {
            log.error("Error applying suggested modifications for medication {}: {}", medication.getName(), e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Optional<AgentMessage> getMessageForMedication(Long medicationId) {
        return agentMessageRepository.findByMedicationId(medicationId);
    }

    @Transactional(readOnly = true)
    public List<AgentMessage> getAllPendingMessages() {
        return agentMessageRepository.findByMedicationMedicationStatus(
            com.pidev.pharmacy.entities.MedicationStatus.PENDING
        );
    }
}
