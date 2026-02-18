package com.pidev.care.repositories;

import com.pidev.care.entities.Caregiver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaregiverRepository extends JpaRepository<Caregiver, Long> {
    Optional<Caregiver> findByUserId(UUID userId);
}
