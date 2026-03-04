package com.pidev.monitoring.controllers;

import com.pidev.monitoring.entities.RiskScore;
import com.pidev.monitoring.services.RiskScoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/risk")
public class RiskScoreController {

    private final RiskScoreService riskScoreService;

    public RiskScoreController(RiskScoreService riskScoreService) {
        this.riskScoreService = riskScoreService;
    }

    @PostMapping
    public RiskScore createRisk(@RequestBody RiskScore riskScore) {
        return riskScoreService.createRiskScore(riskScore);
    }

    @GetMapping
    public List<RiskScore> getAllRisk() {
        return riskScoreService.getAllRiskScores();
    }

    @GetMapping("/by-patient/{patientId}")
    public List<RiskScore> getRiskByPatient(@PathVariable Long patientId) {
        return riskScoreService.getRiskScoresByPatient(patientId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRisk(@PathVariable Long id) {
        riskScoreService.deleteRiskScore(id);
        return ResponseEntity.noContent().build();
    }
}
