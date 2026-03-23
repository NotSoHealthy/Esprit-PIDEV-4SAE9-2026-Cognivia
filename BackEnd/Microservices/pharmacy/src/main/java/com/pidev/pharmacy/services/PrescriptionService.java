package com.pidev.pharmacy.services;

import com.pidev.pharmacy.dto.PrescriptionPharmacyRecommendationDTO;
import com.pidev.pharmacy.entities.Prescription;
import com.pidev.pharmacy.entities.PrescriptionItem;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.MedicationStock;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.entities.Frequency;
import com.pidev.pharmacy.repositories.PrescriptionRepository;
import com.pidev.pharmacy.repositories.MedicationRepository;
import com.pidev.pharmacy.repositories.MedicationStockRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@AllArgsConstructor
@Slf4j
public class PrescriptionService implements IService<Prescription> {

    private static final String CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int CODE_LENGTH = 10;

    private final PrescriptionRepository prescriptionRepository;
    private final MedicationRepository medicationRepository;
    private final MedicationStockRepository medicationStockRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional(readOnly = true)
    public List<Prescription> getAll() {
        return prescriptionRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Prescription getById(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with id: " + id));
    }

    @Override
    @Transactional
    public Prescription create(Prescription entity) {
        entity.setId(null);
        entity.setCode(generateUniquePrescriptionCode());

        // Set creation time
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(Instant.now());
        }

        // Ensure bidirectional relation is set so prescription_id is not null
        if (entity.getItems() != null) {
            entity.getItems().forEach(item -> item.setPrescription(entity));
        }

        log.info(
                "Creating prescription for patient {} by doctor {} with {} item(s)",
                entity.getPatientName(),
                entity.getDoctorName(),
                entity.getItems() == null ? 0 : entity.getItems().size()
        );
        return prescriptionRepository.save(entity);
    }

    @Override
    @Transactional
    public Prescription update(Long id, Prescription entity) {
        Prescription existing = getById(id);

        if (existing.getCode() == null || existing.getCode().isBlank()) {
            existing.setCode(generateUniquePrescriptionCode());
        }

        if (entity.getDoctorName() != null) {
            existing.setDoctorName(entity.getDoctorName());
        }

        // Intentionally do not update createdByDoctorUserId/createdByDoctorUsername here.

        if (entity.getPatientName() != null) {
            existing.setPatientName(entity.getPatientName());
        }

        if (entity.getDescription() != null) {
            existing.setDescription(entity.getDescription());
        }

        if (entity.getExpiresAt() != null) {
            existing.setExpiresAt(entity.getExpiresAt());
        }

        if (entity.getItems() != null) {
            existing.getItems().clear();
            entity.getItems().forEach(item -> {
                item.setId(null);
                item.setPrescription(existing);
                Long medicationId = item.getMedication() != null ? item.getMedication().getId() : null;
                if (medicationId != null) {
                    Medication medication = medicationRepository.findById(medicationId)
                            .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));
                    item.setMedication(medication);
                }
                existing.getItems().add(item);
            });
        }

        log.info("Updating prescription {}", id);
        return prescriptionRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Prescription existing = getById(id);
        // Items are automatically deleted due to cascade delete
        prescriptionRepository.delete(existing);
        log.info("Deleted prescription {} with all its items", id);
    }

    /**
     * Add medication to prescription
     */
    @Transactional
    public Prescription addItem(Long prescriptionId, Long medicationId, Integer quantity, String frequency) {
        Prescription prescription = getById(prescriptionId);

        Medication medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));

        // Check if medication already exists in prescription
        boolean exists = prescription.getItems().stream()
                .anyMatch(item -> item.getMedication().getId().equals(medicationId));

        if (exists) {
            throw new RuntimeException("Medication already exists in this prescription");
        }

        PrescriptionItem item = new PrescriptionItem();
        item.setPrescription(prescription);
        item.setMedication(medication);
        item.setQuantity(quantity);

        if (frequency != null) {
            try {
                item.setFrequency(Frequency.valueOf(frequency.toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid frequency value: {}, skipping", frequency);
            }
        }

        prescription.getItems().add(item);

        log.info("Added medication {} to prescription {}", medicationId, prescriptionId);
        return prescriptionRepository.save(prescription);
    }

    /**
     * Remove medication from prescription
     */
    @Transactional
    public Prescription removeItem(Long prescriptionId, Long medicationId) {
        Prescription prescription = getById(prescriptionId);

        PrescriptionItem itemToRemove = prescription.getItems().stream()
                .filter(item -> item.getMedication().getId().equals(medicationId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Medication not found in prescription"));

        prescription.getItems().remove(itemToRemove);

        log.info("Removed medication {} from prescription {}", medicationId, prescriptionId);
        return prescriptionRepository.save(prescription);
    }

    /**
     * Get all items in a prescription
     */
    @Transactional(readOnly = true)
    public List<PrescriptionItem> getPrescriptionItems(Long prescriptionId) {
        Prescription prescription = getById(prescriptionId);
        return prescription.getItems();
    }

    /**
     * Get all active (non-expired) prescriptions
     */
    @Transactional(readOnly = true)
    public List<Prescription> getActivePrescriptions() {
        Instant now = Instant.now();
        return prescriptionRepository.findAll().stream()
                .filter(p -> p.getExpiresAt() == null || p.getExpiresAt().isAfter(now))
                .toList();
    }

    /**
     * Get all expired prescriptions
     */
    @Transactional(readOnly = true)
    public List<Prescription> getExpiredPrescriptions() {
        Instant now = Instant.now();
        return prescriptionRepository.findAll().stream()
                .filter(p -> p.getExpiresAt() != null && p.getExpiresAt().isBefore(now))
                .toList();
    }

    /**
     * Check if prescription is expired
     */
    public boolean isExpired(Long prescriptionId) {
        Prescription prescription = getById(prescriptionId);
        if (prescription.getExpiresAt() == null) {
            return false;
        }
        return prescription.getExpiresAt().isBefore(Instant.now());
    }

    /**
     * Extend prescription expiration date
     */
    @Transactional
    public Prescription extendExpiration(Long id, Instant newExpirationDate) {
        Prescription prescription = getById(id);
        prescription.setExpiresAt(newExpirationDate);

        log.info("Extended prescription {} expiration to {}", id, newExpirationDate);
        return prescriptionRepository.save(prescription);
    }

    @Transactional(readOnly = true)
    public List<String> searchCodes(String query) {
        String normalizedQuery = query == null ? "" : query.trim();

        if (normalizedQuery.isBlank()) {
            return prescriptionRepository.findAll().stream()
                    .map(Prescription::getCode)
                    .filter(code -> code != null && !code.isBlank())
                    .distinct()
                    .limit(10)
                    .toList();
        }

        return prescriptionRepository.findTop10ByCodeContainingIgnoreCaseOrderByCreatedAtDesc(normalizedQuery).stream()
                .map(Prescription::getCode)
                .filter(code -> code != null && !code.isBlank())
                .distinct()
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PrescriptionPharmacyRecommendationDTO> recommendPharmaciesByPrescriptionCode(String code) {
        if (code == null || code.isBlank()) {
            return List.of();
        }

        Prescription prescription = prescriptionRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new RuntimeException("Prescription not found with code: " + code));

        Set<Long> medicationIds = prescription.getItems().stream()
                .map(PrescriptionItem::getMedication)
                .filter(Objects::nonNull)
                .map(Medication::getId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());

        int totalMedications = medicationIds.size();
        if (totalMedications == 0) {
            return List.of();
        }

        Map<Long, PrescriptionPharmacyRecommendationDTO> recommendationMap = new HashMap<>();

        medicationIds.forEach(medicationId -> {
            List<MedicationStock> stocks = medicationStockRepository.findByMedicationId(medicationId);
            stocks.stream()
                    .filter(stock -> stock.getQuantity() != null && stock.getQuantity() > 0)
                    .forEach(stock -> {
                        Pharmacy pharmacy = stock.getPharmacy();
                        if (pharmacy == null || pharmacy.getId() == null) {
                            return;
                        }

                        PrescriptionPharmacyRecommendationDTO recommendation = recommendationMap.computeIfAbsent(
                                pharmacy.getId(),
                                pharmacyId -> new PrescriptionPharmacyRecommendationDTO(
                                        pharmacy.getId(),
                                        pharmacy.getName(),
                                        pharmacy.getAddress(),
                                        pharmacy.getContactInfo(),
                                        pharmacy.getBannerUrl(),
                                        pharmacy.getLogoUrl(),
                                        0,
                                        totalMedications,
                                        0
                                )
                        );

                        recommendation.setMatchCount(recommendation.getMatchCount() + 1);
                        recommendation.setTotalAvailableQuantity(
                                recommendation.getTotalAvailableQuantity() + stock.getQuantity()
                        );
                    });
        });

        return recommendationMap.values().stream()
                .sorted(Comparator
                        .comparing(PrescriptionPharmacyRecommendationDTO::getMatchCount, Comparator.reverseOrder())
                        .thenComparing(PrescriptionPharmacyRecommendationDTO::getTotalAvailableQuantity, Comparator.reverseOrder())
                        .thenComparing(PrescriptionPharmacyRecommendationDTO::getPharmacyName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(5)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Prescription> getVisibleByPatientNameMentions(List<String> patientNames) {
        if (patientNames == null || patientNames.isEmpty()) {
            return List.of();
        }

        Map<Long, Prescription> uniqueById = new LinkedHashMap<>();

        for (String patientName : patientNames) {
            if (patientName == null) {
                continue;
            }
            String trimmed = patientName.trim();
            if (trimmed.isBlank()) {
                continue;
            }

            List<Prescription> matches = prescriptionRepository
                    .findByPatientNameContainingIgnoreCaseOrderByCreatedAtDesc(trimmed);

            for (Prescription prescription : matches) {
                if (prescription != null && prescription.getId() != null) {
                    uniqueById.putIfAbsent(prescription.getId(), prescription);
                }
            }
        }

        return uniqueById.values().stream().toList();
    }

    private String generateUniquePrescriptionCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = randomCode();
            if (!prescriptionRepository.existsByCode(code)) {
                return code;
            }
        }
        throw new RuntimeException("Unable to generate a unique prescription code");
    }

    private String randomCode() {
        StringBuilder codeBuilder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = secureRandom.nextInt(CODE_CHARACTERS.length());
            codeBuilder.append(CODE_CHARACTERS.charAt(index));
        }
        return codeBuilder.toString();
    }
}

