package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.RestockNotificationSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RestockNotificationSubscriptionRepository extends JpaRepository<RestockNotificationSubscription, Long> {

    boolean existsByMedicationStockIdAndUserId(Long medicationStockId, String userId);

    List<RestockNotificationSubscription> findByMedicationStockId(Long medicationStockId);

    long deleteByMedicationStockId(Long medicationStockId);
}
