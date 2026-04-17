package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.MedicationStock;
import com.pidev.pharmacy.services.MedicationStockService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/medication-stocks")
@AllArgsConstructor
@Slf4j
public class MedicationStockController {

    private final MedicationStockService medicationStockService;

    @GetMapping
    public List<MedicationStock> getAllStocks() {
        return medicationStockService.getAll();
    }

    @GetMapping("/{id}")
    public MedicationStock getStockById(@PathVariable Long id) {
        return medicationStockService.getById(id);
    }

    @PostMapping
    public ResponseEntity<MedicationStock> createStock(@RequestBody MedicationStock stock) {
        try {
            MedicationStock created = medicationStockService.create(stock);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating medication stock", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public MedicationStock updateStock(@PathVariable Long id, @RequestBody MedicationStock stock) {
        return medicationStockService.update(id, stock);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable Long id) {
        medicationStockService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all stocks for a pharmacy
     */
    @GetMapping("/pharmacy/{pharmacyId}")
    public List<MedicationStock> getStocksByPharmacy(@PathVariable Long pharmacyId) {
        return medicationStockService.getStocksByPharmacy(pharmacyId);
    }

    /**
     * Get stock for specific pharmacy and medication
     */
    @GetMapping("/pharmacy/{pharmacyId}/medication/{medicationId}")
    public ResponseEntity<MedicationStock> getStockByPharmacyAndMedication(
            @PathVariable Long pharmacyId,
            @PathVariable Long medicationId) {
        try {
            MedicationStock stock = medicationStockService.getStockByPharmacyAndMedication(pharmacyId, medicationId);
            return ResponseEntity.ok(stock);
        } catch (Exception e) {
            log.error("Error retrieving stock", e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Update quantity for a stock
     */
    @PatchMapping("/pharmacy/{pharmacyId}/medication/{medicationId}/quantity")
    public ResponseEntity<MedicationStock> updateQuantity(
            @PathVariable Long pharmacyId,
            @PathVariable Long medicationId,
            @RequestParam Integer quantity) {
        try {
            MedicationStock updated = medicationStockService.updateQuantity(pharmacyId, medicationId, quantity);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating quantity", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Decrease stock quantity (for sales)
     */
    @PatchMapping("/pharmacy/{pharmacyId}/medication/{medicationId}/decrease")
    public ResponseEntity<MedicationStock> decreaseQuantity(
            @PathVariable Long pharmacyId,
            @PathVariable Long medicationId,
            @RequestParam Integer amount) {
        try {
            MedicationStock updated = medicationStockService.decreaseQuantity(pharmacyId, medicationId, amount);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error decreasing quantity", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * Increase stock quantity (for restocking)
     */
    @PatchMapping("/pharmacy/{pharmacyId}/medication/{medicationId}/increase")
    public ResponseEntity<MedicationStock> increaseQuantity(
            @PathVariable Long pharmacyId,
            @PathVariable Long medicationId,
            @RequestParam Integer amount) {
        try {
            MedicationStock updated = medicationStockService.increaseQuantity(pharmacyId, medicationId, amount);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error increasing quantity", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{stockId}/restock-subscriptions")
    public ResponseEntity<Map<String, String>> subscribeToRestock(
            @PathVariable Long stockId,
            @RequestParam String userId,
            @RequestParam String username) {
        try {
            boolean created = medicationStockService.subscribeToRestock(stockId, userId, username);
            if (created) {
                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(Map.of("message", "Subscription created"));
            }

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Already subscribed"));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", ex.getMessage()));
        } catch (Exception e) {
            log.error("Error subscribing to restock notification", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Failed to subscribe"));
        }
    }
}

