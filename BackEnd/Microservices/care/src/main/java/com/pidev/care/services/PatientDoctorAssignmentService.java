package com.pidev.care.services;

import com.pidev.care.entities.PatientDoctorAssignment;
import com.pidev.care.repositories.PatientDoctorAssignmentRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class PatientDoctorAssignmentService implements IService<PatientDoctorAssignment> {
    private final PatientDoctorAssignmentRepository patientDoctorAssignmentRepository;

    @Override
    public List<PatientDoctorAssignment> getAll() {
        return patientDoctorAssignmentRepository.findAll();
    }

    @Override
    public PatientDoctorAssignment getById(Long id) {
        return patientDoctorAssignmentRepository.findById(id).orElse(null);
    }

    @Override
    public PatientDoctorAssignment create(PatientDoctorAssignment entity) {
        return patientDoctorAssignmentRepository.save(entity);
    }

    @Override
    public PatientDoctorAssignment update(Long id, PatientDoctorAssignment entity) {
        PatientDoctorAssignment existing = patientDoctorAssignmentRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Patient-doctor assignment not found");
        }

        existing.setActive(entity.getActive());
        existing.setDoctor(entity.getDoctor());
        existing.setPatient(entity.getPatient());

        return patientDoctorAssignmentRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        patientDoctorAssignmentRepository.deleteById(id);
    }
}
