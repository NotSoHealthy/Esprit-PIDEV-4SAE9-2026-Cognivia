package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.PrescriptionItem;
import com.pidev.pharmacy.services.PrescriptionItemService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prescription-items")
@AllArgsConstructor
@Slf4j
public class PrescriptionItemController {

    private final PrescriptionItemService prescriptionItemService;

    @GetMapping
    public List<PrescriptionItem> getAllItems() {
        return prescriptionItemService.getAll();
    }

    @GetMapping("/{id}")
    public PrescriptionItem getItemById(@PathVariable Long id) {
        return prescriptionItemService.getById(id);
    }

    @PostMapping
    public ResponseEntity<PrescriptionItem> createItem(@RequestBody PrescriptionItem item) {
        try {
            PrescriptionItem created = prescriptionItemService.create(item);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating prescription item", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public PrescriptionItem updateItem(@PathVariable Long id, @RequestBody PrescriptionItem item) {
        return prescriptionItemService.update(id, item);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        prescriptionItemService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all items for a prescription
     */
    @GetMapping("/prescription/{prescriptionId}")
    public List<PrescriptionItem> getItemsByPrescription(@PathVariable Long prescriptionId) {
        return prescriptionItemService.getItemsByPrescription(prescriptionId);
    }

    /**
     * Get all prescription items for a medication
     */
    @GetMapping("/medication/{medicationId}")
    public List<PrescriptionItem> getItemsByMedication(@PathVariable Long medicationId) {
        return prescriptionItemService.getItemsByMedication(medicationId);
    }

    /**
     * Get specific item by prescription and medication
     */
    @GetMapping("/prescription/{prescriptionId}/medication/{medicationId}")
    public ResponseEntity<PrescriptionItem> getItemByPrescriptionAndMedication(
            @PathVariable Long prescriptionId,
            @PathVariable Long medicationId) {
        try {
            PrescriptionItem item = prescriptionItemService.getItemByPrescriptionAndMedication(prescriptionId, medicationId);
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            log.error("Error retrieving prescription item", e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Add medication to prescription
     */
    @PostMapping("/prescription/{prescriptionId}/medication/{medicationId}")
    public ResponseEntity<PrescriptionItem> addMedicationToPrescription(
            @PathVariable Long prescriptionId,
            @PathVariable Long medicationId,
            @RequestParam Integer quantity,
            @RequestParam(required = false) String frequency) {
        try {
            PrescriptionItem item = prescriptionItemService.addMedicationToPrescription(
                    prescriptionId, medicationId, quantity, frequency);
            return ResponseEntity.status(HttpStatus.CREATED).body(item);
        } catch (Exception e) {
            log.error("Error adding medication to prescription", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Remove medication from prescription
     */
    @DeleteMapping("/prescription/{prescriptionId}/medication/{medicationId}")
    public ResponseEntity<Void> removeMedicationFromPrescription(
            @PathVariable Long prescriptionId,
            @PathVariable Long medicationId) {
        try {
            prescriptionItemService.removeMedicationFromPrescription(prescriptionId, medicationId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error removing medication from prescription", e);
            return ResponseEntity.notFound().build();
        }
    }
}

