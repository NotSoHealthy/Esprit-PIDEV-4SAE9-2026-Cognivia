package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.Pharmacist;
import com.pidev.pharmacy.services.PharmacistService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pharmacist")
@AllArgsConstructor
public class PharmacistController {
    private final PharmacistService pharmacistService;

    @GetMapping
    public List<Pharmacist> getAllPharmacists() {
        return pharmacistService.getAll();
    }

    @GetMapping("/{id}")
    public Pharmacist getPharmacistById(@PathVariable("id") Long id) {
        Pharmacist pharmacist = pharmacistService.getById(id);
        if (pharmacist == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pharmacist not found");
        }
        return pharmacist;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Pharmacist> getPharmacistByUserId(@PathVariable("userId") UUID userId) {
        Pharmacist pharmacist = pharmacistService.getByUserId(userId);
        if (pharmacist == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(pharmacist);
    }

    @PatchMapping("/user/{userId}/assign-pharmacy/{pharmacyId}")
    public Pharmacist assignPharmacyToUser(@PathVariable("userId") UUID userId, @PathVariable("pharmacyId") Long pharmacyId) {
        return pharmacistService.assignPharmacy(userId, pharmacyId);
    }

    @GetMapping("/pharmacy/{pharmacyId}")
    public List<Pharmacist> getPharmacistsByPharmacyId(@PathVariable("pharmacyId") Long pharmacyId) {
        return pharmacistService.getByPharmacyId(pharmacyId);
    }

    @PostMapping
    public Pharmacist createPharmacist(@RequestBody Pharmacist pharmacist) {
        return pharmacistService.create(pharmacist);
    }

    @PostMapping("/register/{userId}")
    public Pharmacist registerPharmacist(@PathVariable("userId") UUID userId, @RequestBody Pharmacist pharmacist) {
        pharmacist.setUserId(userId);
        return pharmacistService.create(pharmacist);
    }

    @PutMapping("/{id}")
    public Pharmacist updatePharmacist(@PathVariable("id") Long id, @RequestBody Pharmacist pharmacist) {
        return pharmacistService.update(id, pharmacist);
    }

    @DeleteMapping("/{id}")
    public void deletePharmacist(@PathVariable("id") Long id) {
        pharmacistService.delete(id);
    }
}
