package com.pidev.pharmacy.services;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
public class PharmacyService implements IService<Pharmacy> {

    private final PharmacyRepository pharmacyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Pharmacy> getAll() {
        return pharmacyRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Pharmacy getById(Long id) {
        return pharmacyRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Pharmacy not found with id: " + id));
    }

    @Override
    public Pharmacy create(Pharmacy entity) {
        entity.setId(null); // ensure new insert
        return pharmacyRepository.save(entity);
    }

    @Override
    public Pharmacy update(Long id, Pharmacy entity) {
        Pharmacy existing = getById(id);

        existing.setName(entity.getName());
        existing.setAddress(entity.getAddress());
        existing.setLatitude(entity.getLatitude());
        existing.setLongitude(entity.getLongitude());

        return pharmacyRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        Pharmacy existing = getById(id);
        pharmacyRepository.delete(existing);
    }
}