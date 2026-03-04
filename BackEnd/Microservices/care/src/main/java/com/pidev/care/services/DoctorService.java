package com.pidev.care.services;

import com.pidev.care.entities.Doctor;
import com.pidev.care.repositories.DoctorRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

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
        existing.setSpecialty(entity.getSpecialty());
        existing.setLicenseNumber(entity.getLicenseNumber());

        return doctorRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        doctorRepository.deleteById(id);
    }

    public Doctor getByUserId(UUID userId) {
        List<Doctor> doctors = doctorRepository.findByUserId(userId);
        if (doctors.isEmpty()) {
            return null;
        }

        Doctor doctor = doctors.get(0);
        Doctor result = new Doctor();
        result.setId(doctor.getId());
        result.setUserId(doctor.getUserId());
        result.setFirstName(doctor.getFirstName());
        result.setLastName(doctor.getLastName());
        result.setSpecialty(doctor.getSpecialty());
        result.setLicenseNumber(doctor.getLicenseNumber());
        return result;
    }
}
