package com.pidev.monitoring.repositories;

import com.pidev.monitoring.entities.RiskScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {
    List<RiskScore> findByPatientId(Long patientId);

    Optional<RiskScore> findTopByPatientIdOrderByGeneratedAtDesc(Long patientId);
}
