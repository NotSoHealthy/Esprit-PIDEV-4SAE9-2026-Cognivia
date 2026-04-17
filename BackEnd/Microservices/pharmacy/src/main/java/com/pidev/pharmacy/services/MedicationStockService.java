package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.MedicationStock;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.entities.RestockNotificationSubscription;
import com.pidev.pharmacy.rabbitMQ.EventPublisher;
import com.pidev.pharmacy.rabbitMQ.GenericEvent;
import com.pidev.pharmacy.repositories.MedicationStockRepository;
import com.pidev.pharmacy.repositories.MedicationRepository;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import com.pidev.pharmacy.repositories.RestockNotificationSubscriptionRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
@Slf4j
public class MedicationStockService implements IService<MedicationStock> {

    private final MedicationStockRepository medicationStockRepository;
    private final PharmacyRepository pharmacyRepository;
    private final MedicationRepository medicationRepository;
    private final RestockNotificationSubscriptionRepository restockSubscriptionRepository;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<MedicationStock> getAll() {
        return medicationStockRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public MedicationStock getById(Long id) {
        return medicationStockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medication Stock not found with id: " + id));
    }

    @Override
    @Transactional
    public MedicationStock create(MedicationStock entity) {
        entity.setId(null);

        // Verify pharmacy exists
        Pharmacy pharmacy = pharmacyRepository.findById(entity.getPharmacy().getId())
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + entity.getPharmacy().getId()));

        // Verify medication exists
        Medication medication = medicationRepository.findById(entity.getMedication().getId())
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + entity.getMedication().getId()));

        entity.setPharmacy(pharmacy);
        entity.setMedication(medication);

        log.info("Creating medication stock for pharmacy {} and medication {}", pharmacy.getId(), medication.getId());
        return medicationStockRepository.save(entity);
    }

    @Override
    @Transactional
    public MedicationStock update(Long id, MedicationStock entity) {
        MedicationStock existing = getById(id);
        int previousQuantity = existing.getQuantity() == null ? 0 : existing.getQuantity();

        if (entity.getQuantity() != null) {
            existing.setQuantity(entity.getQuantity());
        }

        log.info("Updating medication stock {} quantity to {}", id, entity.getQuantity());
        MedicationStock saved = medicationStockRepository.save(existing);
        handleRestockTransition(previousQuantity, saved.getQuantity(), saved);
        return saved;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        MedicationStock existing = getById(id);
        restockSubscriptionRepository.deleteByMedicationStockId(id);
        medicationStockRepository.delete(existing);
        log.info("Deleted medication stock with id: {}", id);
    }

    /**
     * Get all stocks for a specific pharmacy
     */
    @Transactional(readOnly = true)
    public List<MedicationStock> getStocksByPharmacy(Long pharmacyId) {
        pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + pharmacyId));

        return medicationStockRepository.findByPharmacyId(pharmacyId);
    }

    /**
     * Get stock for a specific medication in a pharmacy
     */
    @Transactional(readOnly = true)
    public MedicationStock getStockByPharmacyAndMedication(Long pharmacyId, Long medicationId) {
        pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + pharmacyId));

        medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + medicationId));

        return medicationStockRepository.findByPharmacyIdAndMedicationId(pharmacyId, medicationId)
                .orElseThrow(() -> new RuntimeException("Stock not found for pharmacy " + pharmacyId + " and medication " + medicationId));
    }

    /**
     * Update stock quantity
     */
    @Transactional
    public MedicationStock updateQuantity(Long pharmacyId, Long medicationId, Integer quantity) {
        MedicationStock stock = getStockByPharmacyAndMedication(pharmacyId, medicationId);
        int previousQuantity = stock.getQuantity() == null ? 0 : stock.getQuantity();
        stock.setQuantity(quantity);

        log.info("Updated stock quantity for pharmacy {} medication {} to {}", pharmacyId, medicationId, quantity);
        MedicationStock saved = medicationStockRepository.save(stock);
        handleRestockTransition(previousQuantity, saved.getQuantity(), saved);
        return saved;
    }

    /**
     * Decrease stock quantity (for sales)
     */
    @Transactional
    public MedicationStock decreaseQuantity(Long pharmacyId, Long medicationId, Integer amount) {
        MedicationStock stock = getStockByPharmacyAndMedication(pharmacyId, medicationId);

        if (stock.getQuantity() < amount) {
            throw new RuntimeException("Insufficient stock for medication " + medicationId + " in pharmacy " + pharmacyId);
        }

        stock.setQuantity(stock.getQuantity() - amount);
        log.info("Decreased stock for pharmacy {} medication {} by {}", pharmacyId, medicationId, amount);
        return medicationStockRepository.save(stock);
    }

    /**
     * Increase stock quantity (for restocking)
     */
    @Transactional
    public MedicationStock increaseQuantity(Long pharmacyId, Long medicationId, Integer amount) {
        MedicationStock stock = getStockByPharmacyAndMedication(pharmacyId, medicationId);
        int previousQuantity = stock.getQuantity() == null ? 0 : stock.getQuantity();
        stock.setQuantity(stock.getQuantity() + amount);

        log.info("Increased stock for pharmacy {} medication {} by {}", pharmacyId, medicationId, amount);
        MedicationStock saved = medicationStockRepository.save(stock);
        handleRestockTransition(previousQuantity, saved.getQuantity(), saved);
        return saved;
    }

    @Transactional
    public boolean subscribeToRestock(Long stockId, String userId, String username) {
        String normalizedUserId = normalizeValue(userId);
        String normalizedUsername = normalizeValue(username);

        if (normalizedUserId.isEmpty()) {
            throw new IllegalStateException("Missing userId");
        }

        if (normalizedUsername.isEmpty()) {
            throw new IllegalStateException("Missing username");
        }

        MedicationStock stock = getById(stockId);
        int currentQuantity = stock.getQuantity() == null ? 0 : stock.getQuantity();
        if (currentQuantity > 0) {
            throw new IllegalStateException("Stock is currently available");
        }

        if (restockSubscriptionRepository.existsByMedicationStockIdAndUserId(stockId, normalizedUserId)) {
            return false;
        }

        RestockNotificationSubscription subscription = new RestockNotificationSubscription();
        subscription.setMedicationStock(stock);
        subscription.setUserId(normalizedUserId);
        subscription.setUsername(normalizedUsername);
        subscription.setCreatedAt(Instant.now());
        restockSubscriptionRepository.save(subscription);

        return true;
    }

    private void handleRestockTransition(int previousQuantity, Integer nextQuantityRaw, MedicationStock stock) {
        int nextQuantity = nextQuantityRaw == null ? 0 : nextQuantityRaw;
        if (previousQuantity > 0 || nextQuantity <= 0) {
            return;
        }

        List<RestockNotificationSubscription> subscriptions =
                restockSubscriptionRepository.findByMedicationStockId(stock.getId());

        if (subscriptions.isEmpty()) {
            return;
        }

        List<String> recipientUserIds = subscriptions.stream()
                .map(RestockNotificationSubscription::getUserId)
                .distinct()
                .toList();

        if (recipientUserIds.isEmpty()) {
            return;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("medicationStockId", stock.getId());
        payload.put("medicationId", stock.getMedication() != null ? stock.getMedication().getId() : null);
        payload.put("medicationName", stock.getMedication() != null ? stock.getMedication().getName() : "Medication");
        payload.put("pharmacyId", stock.getPharmacy() != null ? stock.getPharmacy().getId() : null);
        payload.put("pharmacyName", stock.getPharmacy() != null ? stock.getPharmacy().getName() : "Pharmacy");
        payload.put("availableQuantity", nextQuantity);
        payload.put("recipientUserIds", recipientUserIds);

        GenericEvent event = new GenericEvent();
        event.setEventType("MEDICATION_RESTOCKED");
        event.setPayload(payload);

        boolean published = eventPublisher.sendGenericEvent(event, "pharmacy.stock.restocked");
        if (published) {
            restockSubscriptionRepository.deleteByMedicationStockId(stock.getId());
        }
    }

    private String normalizeValue(String value) {
        return value == null ? "" : value.trim();
    }
}


