package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.MedicationStatus;
import com.pidev.pharmacy.repositories.MedicationRepository;
import com.pidev.pharmacy.utils.ImageUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronizationAdapter;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class MedicationService implements IService<Medication> {

    private final MedicationRepository medicationRepository;
    private final ImgbbService imgbbService;
    private final AgentMessageService agentMessageService;

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
    @Transactional
    public Medication create(Medication entity) {
        entity.setId(null);
        Medication savedMedication = medicationRepository.save(entity);
        
        // Note: AI analysis is now triggered after image upload completes (see uploadImage method)
        // This ensures the agent has access to the full medication data including images
        
        return savedMedication;
    }

    @Override
    public Medication update(Long id, Medication entity) {
        Medication existing = getById(id);
        if (entity.getName() != null) {
            existing.setName(entity.getName());
        }
        if (entity.getDescription() != null) {
            existing.setDescription(entity.getDescription());
        }
        if (entity.getTherapeuticClass() != null) {
            existing.setTherapeuticClass(entity.getTherapeuticClass());
        }
        if (entity.getMedicationStatus() != null) {
            existing.setMedicationStatus(entity.getMedicationStatus());
        }
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

    @Transactional(readOnly = true)
    public List<Medication> getByStatus(MedicationStatus status) {
        return medicationRepository.findByMedicationStatus(status);
    }

    @Transactional(readOnly = true)
    public List<Medication> getPendingMedications() {
        return getByStatus(MedicationStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<Medication> getAcceptedMedications() {
        return getByStatus(MedicationStatus.ACCEPTED);
    }

    @Transactional
    public Medication acceptMedication(Long id) {
        Medication medication = getById(id);
        medication.setMedicationStatus(MedicationStatus.ACCEPTED);
        return medicationRepository.save(medication);
    }

    @Transactional
    public Medication patchAndAcceptMedication(Long id) {
        log.info("🔧 Patching and accepting medication ID: {}", id);
        Medication medication = getById(id);
        
        // Apply AI suggested modifications
        agentMessageService.applyModificationsFromMessage(medication);
        
        // Accept the medication
        medication.setMedicationStatus(MedicationStatus.ACCEPTED);
        Medication saved = medicationRepository.save(medication);
        
        log.info("✅ Successfully patched and accepted medication: {}", saved.getName());
        return saved;
    }



    @Transactional
    public Medication uploadImage(Long medicationId, MultipartFile imageFile) throws IOException {
        log.info("📤 Starting image upload for medication ID: {}", medicationId);
        
        Medication medication = getById(medicationId);
        log.info("📝 Retrieved medication: {} (Current ImageUrl: {})", medication.getName(), medication.getImageUrl());
        
        String base64Image = ImageUtils.convertToBase64(imageFile);
        String imageUrl = imgbbService.uploadImage(base64Image);
        log.info("☁️ Image uploaded to imgbb: {}", imageUrl);
        
        medication.setImageUrl(imageUrl);
        log.info("🔗 Set medication ImageUrl in memory: {}", medication.getImageUrl());
        
        Medication savedMedication = medicationRepository.save(medication);
        log.info("💾 Saved medication to DB. Verified ImageUrl in DB: {}", savedMedication.getImageUrl());
        
        // Schedule AI analysis to run AFTER transaction commits (avoids race condition)
        if (savedMedication.getMedicationStatus() == MedicationStatus.PENDING) {
            log.info("⏳ Registering AI analysis to run after transaction commits for: {}", savedMedication.getName());
            Long medicationIdForAsync = savedMedication.getId();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronizationAdapter() {
                @Override
                public void afterCommit() {
                    log.info("✅ Transaction committed. Now starting async AI analysis for medication ID: {}", medicationIdForAsync);
                    agentMessageService.analyzeMedicationRequestAsync(medicationIdForAsync);
                }
            });
        } else {
            log.info("⏭️ Medication status is {}, skipping AI analysis", savedMedication.getMedicationStatus());
        }
        
        return savedMedication;
    }
}
