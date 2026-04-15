package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.RiskScore;
import com.pidev.monitoring.repositories.RiskScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RiskScoreServiceTest {

    @Mock
    private RiskScoreRepository riskScoreRepository;

    @InjectMocks
    private RiskScoreService riskScoreService;

    private RiskScore testRiskScore;

    @BeforeEach
    void setUp() {
        testRiskScore = RiskScore.builder()
                .id(1L)
                .patientId(10L)
                .riskValue(45.5)
                .riskLevel("MEDIUM")
                .trendDirection("STABLE")
                .generatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testCreateRiskScore() {
        when(riskScoreRepository.save(any(RiskScore.class))).thenReturn(testRiskScore);

        RiskScore result = riskScoreService.createRiskScore(new RiskScore());

        assertNotNull(result);
        assertNotNull(result.getGeneratedAt());
        verify(riskScoreRepository).save(any(RiskScore.class));
    }

    @Test
    void testGetAllRiskScores() {
        when(riskScoreRepository.findAll()).thenReturn(Collections.singletonList(testRiskScore));
        List<RiskScore> results = riskScoreService.getAllRiskScores();
        assertEquals(1, results.size());
        verify(riskScoreRepository).findAll();
    }

    @Test
    void testGetRiskScoresByPatient() {
        when(riskScoreRepository.findByPatientId(10L)).thenReturn(Collections.singletonList(testRiskScore));
        List<RiskScore> results = riskScoreService.getRiskScoresByPatient(10L);
        assertEquals(1, results.size());
        assertEquals(10L, results.get(0).getPatientId());
    }

    @Test
    void testDeleteRiskScore() {
        riskScoreService.deleteRiskScore(1L);
        verify(riskScoreRepository).deleteById(1L);
    }
}
