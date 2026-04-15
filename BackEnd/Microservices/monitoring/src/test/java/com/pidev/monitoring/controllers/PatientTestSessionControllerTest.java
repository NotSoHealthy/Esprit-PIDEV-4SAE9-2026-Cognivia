package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.CognitiveTest;
import com.pidev.monitoring.entities.TestAssignment;
import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.services.TestResultService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PatientTestSessionControllerTest {

    @Mock
    private TestResultService service;

    private PatientTestSessionController controller;

    @BeforeEach
    void setUp() {
        controller = new PatientTestSessionController(service);
    }

    @Test
    void createSession_whenTestIdPresent_callsSubmitDirectResult() {
        CognitiveTest test = new CognitiveTest();
        test.setId(7L);
        TestResult session = new TestResult();
        session.setTest(test);

        TestResult created = new TestResult();
        when(service.submitDirectResult(7L, session)).thenReturn(created);

        assertSame(created, controller.createSession(session));
        verify(service).submitDirectResult(7L, session);
        verify(service, never()).submitResult(anyLong(), any());
    }

    @Test
    void createSession_whenNoTestId_callsSubmitResultWithAssignmentId() {
        TestAssignment assignment = new TestAssignment();
        assignment.setId(9L);

        TestResult session = new TestResult();
        session.setAssignment(assignment);

        TestResult created = new TestResult();
        when(service.submitResult(9L, session)).thenReturn(created);

        assertSame(created, controller.createSession(session));
        verify(service).submitResult(9L, session);
        verify(service, never()).submitDirectResult(anyLong(), any());
    }

    @Test
    void getAllSessions_delegates() {
        List<TestResult> list = List.of(new TestResult());
        when(service.getAllResults()).thenReturn(list);
        assertSame(list, controller.getAllSessions());
    }

    @Test
    void getSessionsByPatient_delegates() {
        List<TestResult> list = List.of(new TestResult());
        when(service.getResultsByPatientId(10L)).thenReturn(list);
        assertSame(list, controller.getSessionsByPatient(10L));
    }
}
