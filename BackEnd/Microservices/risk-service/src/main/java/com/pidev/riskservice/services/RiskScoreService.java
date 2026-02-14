package com.pidev.riskservice.services;

import com.pidev.riskservice.entities.RiskScore;
import com.pidev.riskservice.repositories.RiskScoreRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RiskScoreService {

    private final RiskScoreRepository riskScoreRepository;

    public RiskScoreService(RiskScoreRepository riskScoreRepository) {
        this.riskScoreRepository = riskScoreRepository;
    }

    public RiskScore createRiskScore(RiskScore riskScore) {
        riskScore.setGeneratedAt(LocalDateTime.now());
        return riskScoreRepository.save(riskScore);
    }

    public List<RiskScore> getAllRiskScores() {
        return riskScoreRepository.findAll();
    }

    public List<RiskScore> getRiskScoresByPatient(Long patientId) {
        return riskScoreRepository.findByPatientId(patientId);
    }

    public void deleteRiskScore(Long id) {
        riskScoreRepository.deleteById(id);
    }
}
