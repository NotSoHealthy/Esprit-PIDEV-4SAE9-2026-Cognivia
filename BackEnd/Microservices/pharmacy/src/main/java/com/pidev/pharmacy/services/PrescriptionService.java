package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Prescription;
import com.pidev.pharmacy.repositories.PrescriptionRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class PrescriptionService implements IService<Prescription> {

    private final PrescriptionRepository prescriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Prescription> getAll() {
        return prescriptionRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Prescription getById(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with id: " + id));
    }

    @Override
    @Transactional
    public Prescription create(Prescription entity) {
        entity.setId(null);

        // Set creation time
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(Instant.now());
        }

        log.info("Creating prescription");
        return prescriptionRepository.save(entity);
    }

    @Override
    @Transactional
    public Prescription update(Long id, Prescription entity) {
        Prescription existing = getById(id);

        if (entity.getExpiresAt() != null) {
            existing.setExpiresAt(entity.getExpiresAt());
        }

        log.info("Updating prescription {} expiresAt to {}", id, entity.getExpiresAt());
        return prescriptionRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Prescription existing = getById(id);
        prescriptionRepository.delete(existing);
        log.info("Deleted prescription with id: {}", id);
    }

    /**
     * Get all active (non-expired) prescriptions
     */
    @Transactional(readOnly = true)
    public List<Prescription> getActivePrescriptions() {
        Instant now = Instant.now();
        return prescriptionRepository.findAll().stream()
                .filter(p -> p.getExpiresAt() == null || p.getExpiresAt().isAfter(now))
                .toList();
    }

    /**
     * Get all expired prescriptions
     */
    @Transactional(readOnly = true)
    public List<Prescription> getExpiredPrescriptions() {
        Instant now = Instant.now();
        return prescriptionRepository.findAll().stream()
                .filter(p -> p.getExpiresAt() != null && p.getExpiresAt().isBefore(now))
                .toList();
    }

    /**
     * Check if prescription is expired
     */
    public boolean isExpired(Long prescriptionId) {
        Prescription prescription = getById(prescriptionId);
        if (prescription.getExpiresAt() == null) {
            return false;
        }
        return prescription.getExpiresAt().isBefore(Instant.now());
    }

    /**
     * Extend prescription expiration date
     */
    @Transactional
    public Prescription extendExpiration(Long id, Instant newExpirationDate) {
        Prescription prescription = getById(id);
        prescription.setExpiresAt(newExpirationDate);

        log.info("Extended prescription {} expiration to {}", id, newExpirationDate);
        return prescriptionRepository.save(prescription);
    }
}

