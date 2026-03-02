package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.Prescription;
import com.pidev.pharmacy.services.PrescriptionService;
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

    @GetMapping("/{id}")
    public Prescription getPrescriptionById(@PathVariable Long id) {
        return prescriptionService.getById(id);
    }

    @PostMapping
    public ResponseEntity<Prescription> createPrescription(@RequestBody Prescription prescription) {
        try {
            Prescription created = prescriptionService.create(prescription);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating prescription", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public Prescription updatePrescription(@PathVariable Long id, @RequestBody Prescription prescription) {
        return prescriptionService.update(id, prescription);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrescription(@PathVariable Long id) {
        prescriptionService.delete(id);
        return ResponseEntity.noContent().build();
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

