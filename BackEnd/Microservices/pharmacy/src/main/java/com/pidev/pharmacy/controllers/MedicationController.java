package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.services.MedicationService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/medications")
@AllArgsConstructor
@Slf4j
public class MedicationController {

    private final MedicationService medicationService;

    @GetMapping
    public List<Medication> getAllMedications() {
        return medicationService.getAll();
    }

    @GetMapping("/pending")
    public List<Medication> getPendingMedications() {
        return medicationService.getPendingMedications();
    }

    @GetMapping("/accepted")
    public List<Medication> getAcceptedMedications() {
        return medicationService.getAcceptedMedications();
    }

    @PutMapping("/{id}/accept")
    public Medication acceptMedication(@PathVariable Long id) {
        return medicationService.acceptMedication(id);
    }

    @PutMapping("/{id}/patch-and-accept")
    public Medication patchAndAcceptMedication(@PathVariable Long id) {
        return medicationService.patchAndAcceptMedication(id);
    }

    @GetMapping("/{id}")
    public Medication getMedicationById(@PathVariable Long id) {
        return medicationService.getById(id);
    }

    @PostMapping
    public Medication createMedication(@Valid @RequestBody Medication medication) {
        return medicationService.create(medication);
    }

    @PutMapping("/{id}")
    public Medication updateMedication(@PathVariable Long id, @Valid @RequestBody Medication medication) {
        return medicationService.update(id, medication);
    }

    @DeleteMapping("/{id}")
    public void deleteMedication(@PathVariable Long id) {
        medicationService.delete(id);
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<Medication> uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            Medication medication = medicationService.uploadImage(id, file);
            return ResponseEntity.ok(medication);
        } catch (IOException e) {
            log.error("Error uploading medication image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

