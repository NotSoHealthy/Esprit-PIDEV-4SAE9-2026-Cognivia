package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.services.TestResultService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TestResultControllerTest {

    @Mock
    private TestResultService service;

    private TestResultController controller;

    @BeforeEach
    void setUp() {
        controller = new TestResultController(service);
    }

    @Test
    void submitResult_delegates() {
        TestResult input = new TestResult();
        TestResult created = new TestResult();
        when(service.submitResult(1L, input)).thenReturn(created);
        assertSame(created, controller.submitResult(1L, input));
    }

    @Test
    void submitDirectResult_delegates() {
        TestResult input = new TestResult();
        TestResult created = new TestResult();
        when(service.submitDirectResult(2L, input)).thenReturn(created);
        assertSame(created, controller.submitDirectResult(2L, input));
    }

    @Test
    void getAllResults_delegates() {
        List<TestResult> list = List.of(new TestResult());
        when(service.getAllResults()).thenReturn(list);
        assertSame(list, controller.getAllResults());
    }

    @Test
    void getResultById_delegates() {
        TestResult r = new TestResult();
        when(service.getResultById(10L)).thenReturn(r);
        assertSame(r, controller.getResultById(10L));
    }

    @Test
    void getResultByAssignment_delegates() {
        TestResult r = new TestResult();
        when(service.getResultByAssignmentId(11L)).thenReturn(r);
        assertSame(r, controller.getResultByAssignment(11L));
    }
}
