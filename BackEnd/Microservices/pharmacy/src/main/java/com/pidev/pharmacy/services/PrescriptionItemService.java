package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Prescription;
import com.pidev.pharmacy.entities.PrescriptionItem;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.Frequency;
import com.pidev.pharmacy.repositories.PrescriptionItemRepository;
import com.pidev.pharmacy.repositories.PrescriptionRepository;
import com.pidev.pharmacy.repositories.MedicationRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class PrescriptionItemService implements IService<PrescriptionItem> {

    private final PrescriptionItemRepository prescriptionItemRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationRepository medicationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionItem> getAll() {
        return prescriptionItemRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionItem getById(Long id) {
        return prescriptionItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription Item not found with id: " + id));
    }

    @Override
    @Transactional
    public PrescriptionItem create(PrescriptionItem entity) {
        entity.setId(null);

        // Verify prescription exists
        Prescription prescription = prescriptionRepository.findById(entity.getPrescription().getId())
                .orElseThrow(() -> new RuntimeException("Prescription not found with id: " + entity.getPrescription().getId()));

        // Verify medication exists
        Medication medication = medicationRepository.findById(entity.getMedication().getId())
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + entity.getMedication().getId()));

        entity.setPrescription(prescription);
        entity.setMedication(medication);

        log.info("Creating prescription item for prescription {} medication {} quantity {}",
                prescription.getId(), medication.getId(), entity.getQuantity());
        return prescriptionItemRepository.save(entity);
    }

    @Override
    @Transactional
    public PrescriptionItem update(Long id, PrescriptionItem entity) {
        PrescriptionItem existing = getById(id);

        if (entity.getQuantity() != null) {
            existing.setQuantity(entity.getQuantity());
        }

        if (entity.getFrequency() != null) {
            existing.setFrequency(entity.getFrequency());
        }

        log.info("Updating prescription item {} quantity to {} frequency to {}", id, entity.getQuantity(), entity.getFrequency());
        return prescriptionItemRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        PrescriptionItem existing = getById(id);
        prescriptionItemRepository.delete(existing);
        log.info("Deleted prescription item with id: {}", id);
    }

    /**
     * Get all items for a specific prescription
     */
    @Transactional(readOnly = true)
    public List<PrescriptionItem> getItemsByPrescription(Long prescriptionId) {
        prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found with id: " + prescriptionId));

        return prescriptionItemRepository.findByPrescriptionId(prescriptionId);
    }

    /**
     * Get all prescription items for a specific medication
     */
    @Transactional(readOnly = true)
    public List<PrescriptionItem> getItemsByMedication(Long medicationId) {
        medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));

        return prescriptionItemRepository.findByMedicationId(medicationId);
    }

    /**
     * Get prescription item by prescription and medication
     */
    @Transactional(readOnly = true)
    public PrescriptionItem getItemByPrescriptionAndMedication(Long prescriptionId, Long medicationId) {
        prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found with id: " + prescriptionId));

        medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));

        return prescriptionItemRepository.findByPrescriptionIdAndMedicationId(prescriptionId, medicationId)
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Prescription item not found for prescription " + prescriptionId + " and medication " + medicationId));
    }

    /**
     * Add medication to prescription
     */
    @Transactional
    public PrescriptionItem addMedicationToPrescription(Long prescriptionId, Long medicationId, Integer quantity, String frequency) {
        PrescriptionItem item = new PrescriptionItem();

        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found with id: " + prescriptionId));

        Medication medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));

        item.setPrescription(prescription);
        item.setMedication(medication);
        item.setQuantity(quantity);

        if (frequency != null) {
            try {
                item.setFrequency(Frequency.valueOf(frequency.toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid frequency value: {}", frequency);
                item.setFrequency(null);
            }
        }

        log.info("Added medication {} to prescription {} quantity {} frequency {}",
                medicationId, prescriptionId, quantity, frequency);
        return prescriptionItemRepository.save(item);
    }

    /**
     * Remove medication from prescription
     */
    @Transactional
    public void removeMedicationFromPrescription(Long prescriptionId, Long medicationId) {
        PrescriptionItem item = getItemByPrescriptionAndMedication(prescriptionId, medicationId);
        prescriptionItemRepository.delete(item);

        log.info("Removed medication {} from prescription {}", medicationId, prescriptionId);
    }
}



