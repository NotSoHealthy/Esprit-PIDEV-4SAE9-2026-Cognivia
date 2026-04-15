package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.RiskScore;
import com.pidev.monitoring.services.RiskScoreService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class RiskScoreControllerTest {

    @Mock
    private RiskScoreService service;

    private RiskScoreController controller;

    @BeforeEach
    void setUp() {
        controller = new RiskScoreController(service);
    }

    @Test
    void createRisk_delegates() {
        RiskScore input = new RiskScore();
        RiskScore created = new RiskScore();
        when(service.createRiskScore(input)).thenReturn(created);
        assertSame(created, controller.createRisk(input));
    }

    @Test
    void getAllRisk_delegates() {
        List<RiskScore> list = List.of(new RiskScore());
        when(service.getAllRiskScores()).thenReturn(list);
        assertSame(list, controller.getAllRisk());
    }

    @Test
    void getRiskByPatient_delegates() {
        List<RiskScore> list = List.of(new RiskScore());
        when(service.getRiskScoresByPatient(5L)).thenReturn(list);
        assertSame(list, controller.getRiskByPatient(5L));
    }

    @Test
    void deleteRisk_returnsNoContent() {
        ResponseEntity<Void> resp = controller.deleteRisk(1L);
        assertEquals(204, resp.getStatusCode().value());
        verify(service).deleteRiskScore(1L);
    }
}
