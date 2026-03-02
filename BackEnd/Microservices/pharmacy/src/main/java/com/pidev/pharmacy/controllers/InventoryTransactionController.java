package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.InventoryTransaction;
import com.pidev.pharmacy.entities.TransactionType;
import com.pidev.pharmacy.services.InventoryTransactionService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory-transactions")
@AllArgsConstructor
@Slf4j
public class InventoryTransactionController {

    private final InventoryTransactionService inventoryTransactionService;

    @GetMapping
    public List<InventoryTransaction> getAllTransactions() {
        return inventoryTransactionService.getAll();
    }

    @GetMapping("/{id}")
    public InventoryTransaction getTransactionById(@PathVariable Long id) {
        return inventoryTransactionService.getById(id);
    }

    @PostMapping
    public ResponseEntity<InventoryTransaction> createTransaction(@RequestBody InventoryTransaction transaction) {
        try {
            InventoryTransaction created = inventoryTransactionService.create(transaction);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating inventory transaction", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public InventoryTransaction updateTransaction(@PathVariable Long id, @RequestBody InventoryTransaction transaction) {
        return inventoryTransactionService.update(id, transaction);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        inventoryTransactionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all transactions for a pharmacy
     */
    @GetMapping("/pharmacy/{pharmacyId}")
    public List<InventoryTransaction> getTransactionsByPharmacy(@PathVariable Long pharmacyId) {
        return inventoryTransactionService.getTransactionsByPharmacy(pharmacyId);
    }

    /**
     * Get all transactions for a medication
     */
    @GetMapping("/medication/{medicationId}")
    public List<InventoryTransaction> getTransactionsByMedication(@PathVariable Long medicationId) {
        return inventoryTransactionService.getTransactionsByMedication(medicationId);
    }

    /**
     * Get transactions for pharmacy and medication combination
     */
    @GetMapping("/pharmacy/{pharmacyId}/medication/{medicationId}")
    public List<InventoryTransaction> getTransactionsByPharmacyAndMedication(
            @PathVariable Long pharmacyId,
            @PathVariable Long medicationId) {
        return inventoryTransactionService.getTransactionsByPharmacyAndMedication(pharmacyId, medicationId);
    }

    /**
     * Create transaction and apply it to medication stock
     */
    @PostMapping("/apply")
    public ResponseEntity<InventoryTransaction> createAndApplyTransaction(@RequestBody InventoryTransaction transaction) {
        try {
            InventoryTransaction applied = inventoryTransactionService.createAndApplyTransaction(transaction);
            return ResponseEntity.status(HttpStatus.CREATED).body(applied);
        } catch (Exception e) {
            log.error("Error creating and applying transaction", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Get pending transactions (future transactions)
     */
    @GetMapping("/pending")
    public List<InventoryTransaction> getPendingTransactions() {
        return inventoryTransactionService.getPendingTransactions();
    }

    /**
     * Get transactions by type (IN or OUT)
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<InventoryTransaction>> getTransactionsByType(@PathVariable String type) {
        try {
            TransactionType transactionType = TransactionType.valueOf(type.toUpperCase());
            List<InventoryTransaction> transactions = inventoryTransactionService.getTransactionsByType(transactionType);
            return ResponseEntity.ok(transactions);
        } catch (IllegalArgumentException e) {
            log.error("Invalid transaction type: {}", type);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get incoming transactions (IN type)
     */
    @GetMapping("/incoming")
    public List<InventoryTransaction> getIncomingTransactions() {
        return inventoryTransactionService.getIncomingTransactions();
    }

    /**
     * Get outgoing transactions (OUT type)
     */
    @GetMapping("/outgoing")
    public List<InventoryTransaction> getOutgoingTransactions() {
        return inventoryTransactionService.getOutgoingTransactions();
    }
}

