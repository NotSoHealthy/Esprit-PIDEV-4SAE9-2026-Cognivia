package com.pidev.care.services;

import com.pidev.care.entities.Patient;
import com.pidev.care.entities.PatientDoctorAssignment;
import com.pidev.care.entities.Severity;
import com.pidev.care.repositories.PatientRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class PatientService implements IService<Patient> {
    private final PatientRepository patientRepository;
    private final PatientDoctorAssignmentService assignmentService;

    @Override
    public List<Patient> getAll() {
        return patientRepository.findAll();
    }

    @Override
    public Patient getById(Long id) {
        return patientRepository.findById(id).orElse(null);
    }

    @Override
    public Patient create(Patient entity) {
        return patientRepository.save(entity);
    }

    @Override
    public Patient update(Long id, Patient entity) {
        Patient existing = patientRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Patient not found");
        }

        existing.setFirstName(entity.getFirstName());
        existing.setLastName(entity.getLastName());
        existing.setDateOfBirth(entity.getDateOfBirth());
        existing.setCheckInFrequency(entity.getCheckInFrequency());
        existing.setSeverity(entity.getSeverity());

        return patientRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        patientRepository.deleteById(id);
    }

    public Patient getByUserId(UUID userId) {
        return patientRepository.findByUserId(userId)
            .map(patient -> {
                Patient result = new Patient();
                result.setId(patient.getId());
                result.setUserId(patient.getUserId());
                result.setFirstName(patient.getFirstName());
                result.setLastName(patient.getLastName());
                result.setDateOfBirth(patient.getDateOfBirth());
                return result;
            })
            .orElse(null);
    }

    public List<Patient> getByDoctorId(Long doctorId) {
        List<PatientDoctorAssignment> doctorAssignments = assignmentService.getByDoctorId(doctorId);
        return doctorAssignments.stream()
            .filter(PatientDoctorAssignment::getActive)
            .map(PatientDoctorAssignment::getPatient)
            .toList();
    }

    public Patient updateSeverity(Long id, String severity) {
        Patient existing = patientRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Patient not found");
        }

        try {
            existing.setSeverity(Severity.valueOf(severity.toUpperCase()));
            return patientRepository.save(existing);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid severity value");
        }
    }
}
