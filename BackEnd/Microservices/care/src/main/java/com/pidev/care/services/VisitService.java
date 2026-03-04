package com.pidev.care.services;

import com.pidev.care.entities.Visit;
import com.pidev.care.entities.VisitStatus;
import com.pidev.care.repositories.VisitRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class VisitService implements IService<Visit> {
    private final VisitRepository visitRepository;

    @Override
    public List<Visit> getAll() {
        return visitRepository.findAll();
    }

    @Override
    public Visit getById(Long id) {
        return visitRepository.findById(id).orElse(null);
    }

    @Override
    public Visit create(Visit entity) {
        return visitRepository.save(entity);
    }

    @Override
    public Visit update(Long id, Visit entity) {
        Visit existing = visitRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Visit not found");
        }

        existing.setStatus(entity.getStatus());
        existing.setCaregiver(entity.getCaregiver());
        existing.setPatient(entity.getPatient());

        return visitRepository.save(existing);
    }

    public Void markVisitAsCompleted(Long id) {
        Visit existing = visitRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Visit not found");
        }
        existing.setStatus(VisitStatus.COMPLETED);
        visitRepository.save(existing);
        return null;
    }

    @Override
    public void delete(Long id) {
        visitRepository.deleteById(id);
    }

    public List<Visit> getByPatientId(Long patientId) {
        return visitRepository.findByPatientId(patientId);
    }

    public List<Visit> getByCaregiverId(Long caregiverId) {return visitRepository.findByCaregiverId(caregiverId);}
}
