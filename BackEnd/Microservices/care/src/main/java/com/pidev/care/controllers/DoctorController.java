package com.pidev.care.controllers;

import com.pidev.care.entities.Doctor;
import com.pidev.care.services.DoctorService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/doctor")
@AllArgsConstructor
public class DoctorController {
    private final DoctorService doctorService;

    @GetMapping
    public List<Doctor> getAllDoctors() {
        return doctorService.getAll();
    }

    @GetMapping("/{id}")
    public Doctor getDoctorById(@PathVariable Long id) {
        return doctorService.getById(id);
    }

    @GetMapping("/user/{userId}")
    public Doctor getDoctorByUserId(@PathVariable UUID userId) {
        return doctorService.getByUserId(userId);
    }

    @PostMapping
    public Doctor createDoctor(@RequestBody Doctor doctor) {
        return doctorService.create(doctor);
    }

    @PostMapping("/register/{userId}")
    public Doctor registerDoctor(@PathVariable UUID userId, @RequestBody Doctor doctor) {
        doctor.setUserId(userId);
        return doctorService.create(doctor);
    }

    @PutMapping("/{id}")
    public Doctor updateDoctor(@PathVariable Long id, @RequestBody Doctor doctor) {
        return doctorService.update(id, doctor);
    }

    @DeleteMapping("/{id}")
    public void deleteDoctor(@PathVariable Long id) {
        doctorService.delete(id);
    }
}
