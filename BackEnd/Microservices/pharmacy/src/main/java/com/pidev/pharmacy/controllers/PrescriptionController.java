package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.dto.PrescriptionPharmacyRecommendationDTO;
import com.pidev.pharmacy.entities.Prescription;
import com.pidev.pharmacy.entities.PrescriptionItem;
import com.pidev.pharmacy.services.PrescriptionService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/prescriptions")
@AllArgsConstructor
@Slf4j
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping
    public List<Prescription> getAllPrescriptions() {
        return prescriptionService.getAll();
    }

    @GetMapping("/code-suggestions")
    public List<String> getCodeSuggestions(@RequestParam(name = "query", required = false) String query) {
        return prescriptionService.searchCodes(query);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<PrescriptionPharmacyRecommendationDTO>> getRecommendationsByCode(@RequestParam String code) {
        try {
            List<PrescriptionPharmacyRecommendationDTO> recommendations =
                    prescriptionService.recommendPharmaciesByPrescriptionCode(code);
            return ResponseEntity.ok(recommendations);
        } catch (RuntimeException ex) {
            log.warn("Unable to load recommendations for code {}: {}", code, ex.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/{id}")
    public Prescription getPrescriptionById(@PathVariable Long id) {
        return prescriptionService.getById(id);
    }

    @PostMapping
    public ResponseEntity<Prescription> createPrescription(@Valid @RequestBody Prescription prescription) {
        try {
            Prescription created = prescriptionService.create(prescription);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating prescription", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public Prescription updatePrescription(@PathVariable Long id, @Valid @RequestBody Prescription prescription) {
        return prescriptionService.update(id, prescription);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrescription(@PathVariable Long id) {
        prescriptionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all items in a prescription
     */
    @GetMapping("/{id}/items")
    public List<PrescriptionItem> getPrescriptionItems(@PathVariable Long id) {
        return prescriptionService.getPrescriptionItems(id);
    }

    /**
     * Add medication to prescription
     */
    @PostMapping("/{prescriptionId}/add-medication/{medicationId}")
    public ResponseEntity<Prescription> addMedicationToPrescription(
            @PathVariable Long prescriptionId,
            @PathVariable Long medicationId,
            @RequestParam Integer quantity,
            @RequestParam(required = false) String frequency) {
        try {
            Prescription updated = prescriptionService.addItem(prescriptionId, medicationId, quantity, frequency);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error adding medication to prescription", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Remove medication from prescription
     */
    @DeleteMapping("/{prescriptionId}/remove-medication/{medicationId}")
    public ResponseEntity<Prescription> removeMedicationFromPrescription(
            @PathVariable Long prescriptionId,
            @PathVariable Long medicationId) {
        try {
            Prescription updated = prescriptionService.removeItem(prescriptionId, medicationId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error removing medication from prescription", e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all active prescriptions
     */
    @GetMapping("/active")
    public List<Prescription> getActivePrescriptions() {
        return prescriptionService.getActivePrescriptions();
    }

    /**
     * Get all expired prescriptions
     */
    @GetMapping("/expired")
    public List<Prescription> getExpiredPrescriptions() {
        return prescriptionService.getExpiredPrescriptions();
    }

    /**
     * Check if prescription is expired
     */
    @GetMapping("/{id}/is-expired")
    public ResponseEntity<Boolean> isExpired(@PathVariable Long id) {
        try {
            boolean expired = prescriptionService.isExpired(id);
            return ResponseEntity.ok(expired);
        } catch (Exception e) {
            log.error("Error checking prescription expiration", e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Extend prescription expiration
     */
    @PatchMapping("/{id}/extend")
    public ResponseEntity<Prescription> extendExpiration(
            @PathVariable Long id,
            @RequestParam Long expirationTimestamp) {
        try {
            Instant newExpiration = Instant.ofEpochMilli(expirationTimestamp);
            Prescription extended = prescriptionService.extendExpiration(id, newExpiration);
            return ResponseEntity.ok(extended);
        } catch (Exception e) {
            log.error("Error extending prescription expiration", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}

