package com.pidev.care.services;

import com.pidev.care.entities.EmergencyContact;
import com.pidev.care.repositories.EmergencyContactRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class EmergencyContactService implements IService<EmergencyContact> {
    private final EmergencyContactRepository emergencyContactRepository;

    @Override
    public List<EmergencyContact> getAll() {
        return emergencyContactRepository.findAll();
    }

    @Override
    public EmergencyContact getById(Long id) {
        return emergencyContactRepository.findById(id).orElse(null);
    }

    @Override
    public EmergencyContact create(EmergencyContact entity) {
        return emergencyContactRepository.save(entity);
    }

    @Override
    public EmergencyContact update(Long id, EmergencyContact entity) {
        EmergencyContact existing = emergencyContactRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Emergency contact not found");
        }

        existing.setFirstName(entity.getFirstName());
        existing.setLastName(entity.getLastName());
        existing.setEmail(entity.getEmail());
        existing.setPhoneNumber(entity.getPhoneNumber());
        existing.setRelation(entity.getRelation());

        return emergencyContactRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        emergencyContactRepository.deleteById(id);
    }
}
