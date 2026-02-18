package com.pidev.care.controllers;

import com.pidev.care.entities.PatientDoctorAssignment;
import com.pidev.care.services.PatientDoctorAssignmentService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patientdoctorassignment")
@AllArgsConstructor
public class PatientDoctorAssignmentController {
    private final PatientDoctorAssignmentService patientDoctorAssignmentService;

    @GetMapping
    public List<PatientDoctorAssignment> getAllPatientDoctorAssignments() {
        return patientDoctorAssignmentService.getAll();
    }

    @GetMapping("/{id}")
    public PatientDoctorAssignment getPatientDoctorAssignmentById(@PathVariable Long id) {
        return patientDoctorAssignmentService.getById(id);
    }

    @PostMapping
    public PatientDoctorAssignment createPatientDoctorAssignment(@RequestBody PatientDoctorAssignment patientDoctorAssignment) {
        return patientDoctorAssignmentService.create(patientDoctorAssignment);
    }

    @PutMapping("/{id}")
    public PatientDoctorAssignment updatePatientDoctorAssignment(@PathVariable Long id,
                                                               @RequestBody PatientDoctorAssignment patientDoctorAssignment) {
        return patientDoctorAssignmentService.update(id, patientDoctorAssignment);
    }

    @DeleteMapping("/{id}")
    public void deletePatientDoctorAssignment(@PathVariable Long id) {
        patientDoctorAssignmentService.delete(id);
    }
}
