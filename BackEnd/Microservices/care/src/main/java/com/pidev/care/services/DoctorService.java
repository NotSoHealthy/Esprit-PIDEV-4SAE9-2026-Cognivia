package com.pidev.care.services;

import com.pidev.care.entities.Doctor;
import com.pidev.care.repositories.DoctorRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class DoctorService implements IService<Doctor> {
    private final DoctorRepository doctorRepository;

    @Override
    public List<Doctor> getAll() {
        return doctorRepository.findAll();
    }

    @Override
    public Doctor getById(Long id) {
        return doctorRepository.findById(id).orElse(null);
    }

    @Override
    public Doctor create(Doctor entity) {
        return doctorRepository.save(entity);
    }

    @Override
    public Doctor update(Long id, Doctor entity) {
        Doctor existing = doctorRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Doctor not found");
        }

        existing.setFirstName(entity.getFirstName());
        existing.setLastName(entity.getLastName());
        existing.setSpecialization(entity.getSpecialization());
        existing.setLicenseNumber(entity.getLicenseNumber());

        return doctorRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        doctorRepository.deleteById(id);
    }
}
