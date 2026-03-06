package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.entities.Pharmacist;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import com.pidev.pharmacy.repositories.PharmacistRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class PharmacistService implements IService<Pharmacist> {
    private final PharmacistRepository pharmacistRepository;
    private final PharmacyRepository pharmacyRepository;
    private final PharmacyService pharmacyService;

    @Override
    public List<Pharmacist> getAll() {
        return pharmacistRepository.findAll();
    }

    @Override
    public Pharmacist getById(Long id) {
        return pharmacistRepository.findById(id).orElse(null);
    }

    @Override
    public Pharmacist create(Pharmacist entity) {
        return pharmacistRepository.save(entity);
    }

    @Override
    public Pharmacist update(Long id, Pharmacist entity) {
        Pharmacist existing = pharmacistRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Pharmacist not found");
        }

        existing.setFirstName(entity.getFirstName());
        existing.setLastName(entity.getLastName());
        existing.setLicenseNumber(entity.getLicenseNumber());
        existing.setPhoneNumber(entity.getPhoneNumber());
        
        // Only update pharmacy if provided
        if (entity.getPharmacy() != null) {
            existing.setPharmacy(entity.getPharmacy());
        }

        return pharmacistRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        Pharmacist existing = pharmacistRepository.findById(id).orElse(null);
        if (existing == null) {
            return;
        }

        Long pharmacyId = existing.getPharmacy() != null ? existing.getPharmacy().getId() : null;
        if (pharmacyId != null) {
            pharmacyService.delete(pharmacyId);
            return;
        }

        pharmacistRepository.deleteById(id);
    }

    public Pharmacist getByUserId(UUID userId) {
        List<Pharmacist> pharmacists = pharmacistRepository.findByUserIdOrderByIdDesc(userId);
        if (pharmacists.isEmpty()) {
            return null;
        }

        Pharmacist pharmacist = pharmacists.get(0);
        Pharmacist result = new Pharmacist();
        result.setId(pharmacist.getId());
        result.setUserId(pharmacist.getUserId());
        result.setFirstName(pharmacist.getFirstName());
        result.setLastName(pharmacist.getLastName());
        result.setLicenseNumber(pharmacist.getLicenseNumber());
        result.setPhoneNumber(pharmacist.getPhoneNumber());
        result.setPharmacy(pharmacist.getPharmacy());
        return result;
    }

    public Pharmacist assignPharmacy(UUID userId, Long pharmacyId) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId).orElse(null);
        if (pharmacy == null) {
            throw new IllegalArgumentException("Pharmacy not found");
        }

        Pharmacist pharmacist = pharmacistRepository.findByUserIdOrderByIdDesc(userId).stream().findFirst().orElse(null);
        if (pharmacist == null) {
            pharmacist = new Pharmacist();
            pharmacist.setUserId(userId);
        }

        pharmacist.setPharmacy(pharmacy);
        return pharmacistRepository.save(pharmacist);
    }

    public List<Pharmacist> getByPharmacyId(Long pharmacyId) {
        return pharmacistRepository.findByPharmacy_Id(pharmacyId);
    }
}
