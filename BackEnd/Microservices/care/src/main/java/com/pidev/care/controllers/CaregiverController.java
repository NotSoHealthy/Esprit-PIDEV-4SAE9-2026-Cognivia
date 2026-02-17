package com.pidev.care.controllers;

import com.pidev.care.entities.Caregiver;
import com.pidev.care.services.CaregiverService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/caregiver")
@AllArgsConstructor
public class CaregiverController {
    private final CaregiverService careGiverService;

    @GetMapping
    public List<Caregiver> getAllCaregivers() {
        return careGiverService.getAll();
    }

    @GetMapping("/{id}")
    public Caregiver getCaregiverById(@PathVariable Long id) {
        return careGiverService.getById(id);
    }

    @PostMapping
    public Caregiver createCaregiver(@RequestBody Caregiver careGiver) {
        return careGiverService.create(careGiver);
    }

    @PutMapping("/{id}")
    public Caregiver updateCaregiver(@PathVariable Long id, @RequestBody Caregiver careGiver) {
        return careGiverService.update(id, careGiver);
    }

    @DeleteMapping("/{id}")
    public void deleteCaregiver(@PathVariable Long id) {
        careGiverService.delete(id);
    }
}
