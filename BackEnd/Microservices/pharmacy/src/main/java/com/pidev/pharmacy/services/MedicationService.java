package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.repositories.MedicationRepository;
import com.pidev.pharmacy.utils.ImageUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@AllArgsConstructor
public class MedicationService implements IService<Medication> {

    private final MedicationRepository medicationRepository;
    private final ImgbbService imgbbService;

    @Override
    @Transactional(readOnly = true)
    public List<Medication> getAll() {
        return medicationRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Medication getById(Long id) {
        return medicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + id));
    }

    @Override
    public Medication create(Medication entity) {
        entity.setId(null);
        return medicationRepository.save(entity);
    }

    @Override
    public Medication update(Long id, Medication entity) {
        Medication existing = getById(id);
        existing.setName(entity.getName());
        if (entity.getImageUrl() != null) {
            existing.setImageUrl(entity.getImageUrl());
        }
        return medicationRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        Medication existing = getById(id);
        medicationRepository.delete(existing);
    }

    @Transactional
    public Medication uploadImage(Long medicationId, MultipartFile imageFile) throws IOException {
        Medication medication = getById(medicationId);
        String base64Image = ImageUtils.convertToBase64(imageFile);
        String imageUrl = imgbbService.uploadImage(base64Image);
        medication.setImageUrl(imageUrl);
        return medicationRepository.save(medication);
    }
}

