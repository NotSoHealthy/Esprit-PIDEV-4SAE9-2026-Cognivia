package com.pidev.riskservice.repositories;

import com.pidev.riskservice.entities.RiskScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {
    List<RiskScore> findByPatientId(Long patientId);
}
