package com.pidev.pharmacy.controllers;


import com.pidev.pharmacy.dto.PharmacyUpdateInfoDTO;
import com.pidev.pharmacy.dto.PharmacyUpdateLocationDTO;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.services.PharmacyService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;


@RestController
@RequestMapping("/pharmacies")
@AllArgsConstructor
@Slf4j
public class PharmacyController {

    private final PharmacyService pharmacyService;

    @GetMapping
    public List<Pharmacy> getAllPharmacies() {
        return pharmacyService.getAll();
    }

    @GetMapping("/{id}")
    public Pharmacy getPharmacyById(@PathVariable Long id) {
        return pharmacyService.getById(id);
    }

    @PostMapping
    public Pharmacy createPharmacy(@RequestBody Pharmacy pharmacy) {
        return pharmacyService.create(pharmacy);
    }

    @PutMapping("/{id}")
    public Pharmacy updatePharmacy(@PathVariable Long id, @RequestBody Pharmacy pharmacy) {
        return pharmacyService.update(id, pharmacy);
    }

    @DeleteMapping("/{id}")
    public void deletePharmacy(@PathVariable Long id) {
        pharmacyService.delete(id);
    }

    @PostMapping("/{id}/upload-banner")
    public ResponseEntity<Pharmacy> uploadBannerImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            Pharmacy pharmacy = pharmacyService.uploadBannerImage(id, file);
            return ResponseEntity.ok(pharmacy);
        } catch (IOException e) {
            log.error("Error uploading banner image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/upload-logo")
    public ResponseEntity<Pharmacy> uploadLogoImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            Pharmacy pharmacy = pharmacyService.uploadLogoImage(id, file);
            return ResponseEntity.ok(pharmacy);
        } catch (IOException e) {
            log.error("Error uploading logo image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/upload-images")
    public ResponseEntity<Pharmacy> uploadPharmacyImages(
            @PathVariable Long id,
            @RequestParam(value = "banner", required = false) MultipartFile bannerFile,
            @RequestParam(value = "logo", required = false) MultipartFile logoFile) {
        try {
            if ((bannerFile == null || bannerFile.isEmpty()) &&
                (logoFile == null || logoFile.isEmpty())) {
                return ResponseEntity.badRequest().build();
            }
            Pharmacy pharmacy = pharmacyService.uploadPharmacyImages(id, bannerFile, logoFile);
            return ResponseEntity.ok(pharmacy);
        } catch (IOException e) {
            log.error("Error uploading pharmacy images", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{id}/update-info")
    public ResponseEntity<Pharmacy> updatePharmacyInfo(
            @PathVariable Long id,
            @RequestBody PharmacyUpdateInfoDTO dto) {
        try {
            Pharmacy pharmacy = pharmacyService.updatePharmacyInfo(id, dto);
            return ResponseEntity.ok(pharmacy);
        } catch (Exception e) {
            log.error("Error updating pharmacy info", e);
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/update-location")
    public ResponseEntity<Pharmacy> updatePharmacyLocation(
            @PathVariable Long id,
            @RequestBody PharmacyUpdateLocationDTO dto) {
        try {
            Pharmacy pharmacy = pharmacyService.updatePharmacyLocation(id, dto);
            return ResponseEntity.ok(pharmacy);
        } catch (Exception e) {
            log.error("Error updating pharmacy location", e);
            return ResponseEntity.notFound().build();
        }
    }
}