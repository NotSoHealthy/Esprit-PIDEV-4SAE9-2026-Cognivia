package com.pidev.pharmacy.controllers;


import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.services.PharmacyService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/pharmacies")
@AllArgsConstructor
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
}