package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.MedicationStock;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.repositories.MedicationStockRepository;
import com.pidev.pharmacy.repositories.MedicationRepository;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class MedicationStockService implements IService<MedicationStock> {

    private final MedicationStockRepository medicationStockRepository;
    private final PharmacyRepository pharmacyRepository;
    private final MedicationRepository medicationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MedicationStock> getAll() {
        return medicationStockRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public MedicationStock getById(Long id) {
        return medicationStockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medication Stock not found with id: " + id));
    }

    @Override
    @Transactional
    public MedicationStock create(MedicationStock entity) {
        entity.setId(null);

        // Verify pharmacy exists
        Pharmacy pharmacy = pharmacyRepository.findById(entity.getPharmacy().getId())
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + entity.getPharmacy().getId()));

        // Verify medication exists
        Medication medication = medicationRepository.findById(entity.getMedication().getId())
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + entity.getMedication().getId()));

        entity.setPharmacy(pharmacy);
        entity.setMedication(medication);

        log.info("Creating medication stock for pharmacy {} and medication {}", pharmacy.getId(), medication.getId());
        return medicationStockRepository.save(entity);
    }

    @Override
    @Transactional
    public MedicationStock update(Long id, MedicationStock entity) {
        MedicationStock existing = getById(id);

        if (entity.getQuantity() != null) {
            existing.setQuantity(entity.getQuantity());
        }

        log.info("Updating medication stock {} quantity to {}", id, entity.getQuantity());
        return medicationStockRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        MedicationStock existing = getById(id);
        medicationStockRepository.delete(existing);
        log.info("Deleted medication stock with id: {}", id);
    }

    /**
     * Get all stocks for a specific pharmacy
     */
    @Transactional(readOnly = true)
    public List<MedicationStock> getStocksByPharmacy(Long pharmacyId) {
        pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + pharmacyId));

        return medicationStockRepository.findByPharmacyId(pharmacyId);
    }

    /**
     * Get stock for a specific medication in a pharmacy
     */
    @Transactional(readOnly = true)
    public MedicationStock getStockByPharmacyAndMedication(Long pharmacyId, Long medicationId) {
        pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + pharmacyId));

        medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));

        return medicationStockRepository.findByPharmacyIdAndMedicationId(pharmacyId, medicationId)
                .orElseThrow(() -> new RuntimeException("Stock not found for pharmacy " + pharmacyId + " and medication " + medicationId));
    }

    /**
     * Update stock quantity
     */
    @Transactional
    public MedicationStock updateQuantity(Long pharmacyId, Long medicationId, Integer quantity) {
        MedicationStock stock = getStockByPharmacyAndMedication(pharmacyId, medicationId);
        stock.setQuantity(quantity);

        log.info("Updated stock quantity for pharmacy {} medication {} to {}", pharmacyId, medicationId, quantity);
        return medicationStockRepository.save(stock);
    }

    /**
     * Decrease stock quantity (for sales)
     */
    @Transactional
    public MedicationStock decreaseQuantity(Long pharmacyId, Long medicationId, Integer amount) {
        MedicationStock stock = getStockByPharmacyAndMedication(pharmacyId, medicationId);

        if (stock.getQuantity() < amount) {
            throw new RuntimeException("Insufficient stock for medication " + medicationId + " in pharmacy " + pharmacyId);
        }

        stock.setQuantity(stock.getQuantity() - amount);
        log.info("Decreased stock for pharmacy {} medication {} by {}", pharmacyId, medicationId, amount);
        return medicationStockRepository.save(stock);
    }

    /**
     * Increase stock quantity (for restocking)
     */
    @Transactional
    public MedicationStock increaseQuantity(Long pharmacyId, Long medicationId, Integer amount) {
        MedicationStock stock = getStockByPharmacyAndMedication(pharmacyId, medicationId);
        stock.setQuantity(stock.getQuantity() + amount);

        log.info("Increased stock for pharmacy {} medication {} by {}", pharmacyId, medicationId, amount);
        return medicationStockRepository.save(stock);
    }
}


