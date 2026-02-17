package com.pidev.care.services;

import com.pidev.care.entities.Caregiver;
import com.pidev.care.repositories.CaregiverRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class CaregiverService implements IService<Caregiver> {
    private final CaregiverRepository careGiverRepository;

    @Override
    public List<Caregiver> getAll() {
        return careGiverRepository.findAll();
    }

    @Override
    public Caregiver getById(Long id) {
        return careGiverRepository.findById(id).orElse(null);
    }

    @Override
    public Caregiver create(Caregiver entity) {
        return careGiverRepository.save(entity);
    }

    @Override
    public Caregiver update(Long id, Caregiver entity) {
        Caregiver existing = careGiverRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Caregiver not found");
        }

        existing.setFirstName(entity.getFirstName());
        existing.setLastName(entity.getLastName());
        existing.setType(entity.getType());

        return careGiverRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        careGiverRepository.deleteById(id);
    }
}
