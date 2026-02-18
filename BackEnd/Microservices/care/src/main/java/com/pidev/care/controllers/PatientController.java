package com.pidev.care.controllers;

import com.pidev.care.entities.Patient;
import com.pidev.care.services.PatientService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/patient")
@AllArgsConstructor
public class PatientController {
    private final PatientService patientService;

    @GetMapping
    public List<Patient> getAllPatients() {
        return patientService.getAll();
    }

    @GetMapping("/{id}")
    public Patient getPatientById(@PathVariable Long id) {
        return patientService.getById(id);
    }

    @GetMapping("/user/{userId}")
    public Patient getPatientByUserId(@PathVariable UUID userId) {
        return patientService.getByUserId(userId);
    }

    @PostMapping
    public Patient createPatient(@RequestBody Patient patient) {return patientService.create(patient);}

    @PostMapping("/register/{userId}")
    public Patient registerPatient(@PathVariable UUID userId, @RequestBody Patient patient) {
        patient.setUserId(userId);
        return patientService.create(patient);
    }

    @PutMapping("/{id}")
    public Patient updatePatient(@PathVariable Long id, @RequestBody Patient patient) {
        return patientService.update(id, patient);
    }

    @DeleteMapping("/{id}")
    public void deletePatient(@PathVariable Long id) {patientService.delete(id);}
}
