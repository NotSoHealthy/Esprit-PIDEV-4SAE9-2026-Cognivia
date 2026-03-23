package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.InventoryTransaction;
import com.pidev.pharmacy.entities.TransactionType;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.repositories.InventoryTransactionRepository;
import com.pidev.pharmacy.repositories.MedicationRepository;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class InventoryTransactionService implements IService<InventoryTransaction> {

    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final PharmacyRepository pharmacyRepository;
    private final MedicationRepository medicationRepository;
    private final MedicationStockService medicationStockService;

    @Override
    @Transactional(readOnly = true)
    public List<InventoryTransaction> getAll() {
        return inventoryTransactionRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryTransaction getById(Long id) {
        return inventoryTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory Transaction not found with id: " + id));
    }

    @Override
    @Transactional
    public InventoryTransaction create(InventoryTransaction entity) {
        entity.setId(null);

        // Verify pharmacy exists
        Pharmacy pharmacy = pharmacyRepository.findById(entity.getPharmacy().getId())
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + entity.getPharmacy().getId()));

        // Verify medication exists
        Medication medication = medicationRepository.findById(entity.getMedication().getId())
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + entity.getMedication().getId()));

        entity.setPharmacy(pharmacy);
        entity.setMedication(medication);

        // Set default transaction time to now if not provided
        if (entity.getTransactionAt() == null) {
            entity.setTransactionAt(Instant.now());
        }

        // Validate transaction type
        if (entity.getType() == null) {
            throw new RuntimeException("Transaction type is required (IN or OUT)");
        }

        log.info("Creating inventory transaction for pharmacy {} medication {} quantity {} type {}",
                pharmacy.getId(), medication.getId(), entity.getQuantity(), entity.getType());
        return inventoryTransactionRepository.save(entity);
    }

    @Override
    @Transactional
    public InventoryTransaction update(Long id, InventoryTransaction entity) {
        InventoryTransaction existing = getById(id);

        if (entity.getQuantity() != null) {
            existing.setQuantity(entity.getQuantity());
        }

        if (entity.getTransactionAt() != null) {
            existing.setTransactionAt(entity.getTransactionAt());
        }

        if (entity.getType() != null) {
            existing.setType(entity.getType());
        }

        log.info("Updating transaction {} quantity to {} transactionAt to {} type to {}",
                id, entity.getQuantity(), entity.getTransactionAt(), entity.getType());
        return inventoryTransactionRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        InventoryTransaction existing = getById(id);
        inventoryTransactionRepository.delete(existing);
        log.info("Deleted inventory transaction with id: {}", id);
    }

    /**
     * Get all transactions for a specific pharmacy
     */
    @Transactional(readOnly = true)
    public List<InventoryTransaction> getTransactionsByPharmacy(Long pharmacyId) {
        pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + pharmacyId));

        return inventoryTransactionRepository.findByPharmacyId(pharmacyId);
    }

    /**
     * Get all transactions for a specific medication
     */
    @Transactional(readOnly = true)
    public List<InventoryTransaction> getTransactionsByMedication(Long medicationId) {
        medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));

        return inventoryTransactionRepository.findByMedicationId(medicationId);
    }

    /**
     * Get transactions for a pharmacy and medication combination
     */
    @Transactional(readOnly = true)
    public List<InventoryTransaction> getTransactionsByPharmacyAndMedication(Long pharmacyId, Long medicationId) {
        pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + pharmacyId));

        medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));

        return inventoryTransactionRepository.findByPharmacyIdAndMedicationId(pharmacyId, medicationId);
    }

    /**
     * Create a transaction and automatically update the medication stock
     */
    @Transactional
    public InventoryTransaction createAndApplyTransaction(InventoryTransaction transaction) {
        // Create the transaction record
        InventoryTransaction savedTransaction = create(transaction);

        // Update the medication stock based on transaction type
        if (transaction.getType() == TransactionType.IN) {
            // Stock coming in - increase quantity
            medicationStockService.increaseQuantity(
                    transaction.getPharmacy().getId(),
                    transaction.getMedication().getId(),
                    transaction.getQuantity()
            );
        } else if (transaction.getType() == TransactionType.OUT) {
            // Stock going out - decrease quantity
            medicationStockService.decreaseQuantity(
                    transaction.getPharmacy().getId(),
                    transaction.getMedication().getId(),
                    transaction.getQuantity()
            );
        }

        log.info("Applied transaction: pharmacy {} medication {} quantity {} type {}",
                transaction.getPharmacy().getId(), transaction.getMedication().getId(),
                transaction.getQuantity(), transaction.getType());

        return savedTransaction;
    }

    /**
     * Get pending transactions (transactionAt is in the future)
     */
    @Transactional(readOnly = true)
    public List<InventoryTransaction> getPendingTransactions() {
        Instant now = Instant.now();
        return inventoryTransactionRepository.findAll().stream()
                .filter(t -> t.getTransactionAt() != null && t.getTransactionAt().isAfter(now))
                .toList();
    }

    /**
     * Get transactions by type (IN or OUT)
     */
    @Transactional(readOnly = true)
    public List<InventoryTransaction> getTransactionsByType(TransactionType type) {
        return inventoryTransactionRepository.findAll().stream()
                .filter(t -> t.getType() == type)
                .toList();
    }

    /**
     * Get IN transactions (stock coming in)
     */
    @Transactional(readOnly = true)
    public List<InventoryTransaction> getIncomingTransactions() {
        return getTransactionsByType(TransactionType.IN);
    }

    /**
     * Get OUT transactions (stock going out)
     */
    @Transactional(readOnly = true)
    public List<InventoryTransaction> getOutgoingTransactions() {
        return getTransactionsByType(TransactionType.OUT);
    }
}

