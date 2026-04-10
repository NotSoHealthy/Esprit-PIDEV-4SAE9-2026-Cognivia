package com.pidev.care.controllers;

import com.pidev.care.dto.CaregiverDto;
import com.pidev.care.entities.Caregiver;
import com.pidev.care.services.CaregiverService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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

    @GetMapping("/dto/{id}")
    public CaregiverDto getCaregiverDtoById(@PathVariable Long id) {
        return CaregiverDto.fromCaregiver(careGiverService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public Caregiver getCaregiverByUserId(@PathVariable UUID userId) {
        return careGiverService.getByUserId(userId);
    }

    @PostMapping
    public Caregiver createCaregiver(@RequestBody Caregiver careGiver) {return careGiverService.create(careGiver);}

    @PostMapping("/register/{userId}")
    public Caregiver registerCaregiver(@PathVariable UUID userId, @RequestBody Caregiver careGiver) {
        careGiver.setUserId(userId);
        return careGiverService.create(careGiver);
    }

    @PutMapping("/{id}")
    public Caregiver updateCaregiver(@PathVariable Long id, @RequestBody Caregiver careGiver) {
        return careGiverService.update(id, careGiver);
    }

    @DeleteMapping("/{id}")
    public void deleteCaregiver(@PathVariable Long id) {careGiverService.delete(id);}
}
