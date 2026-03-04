package com.pidev.monitoring.controllers;

import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.services.TestResultService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sessions")
public class PatientTestSessionController {

    private final TestResultService testResultService;

    public PatientTestSessionController(TestResultService testResultService) {
        this.testResultService = testResultService;
    }

    @PostMapping
    public TestResult createSession(@RequestBody TestResult session) {
        // Assuming direct submission for session creation for now
        // If it requires a testId, we might need a different mapping or handle it in
        // service
        if (session.getTest() != null && session.getTest().getId() != null) {
            return testResultService.submitDirectResult(session.getTest().getId(), session);
        }
        return testResultService.submitResult(session.getAssignment().getId(), session);
    }

    @GetMapping
    public List<TestResult> getAllSessions() {
        return testResultService.getAllResults();
    }

    @GetMapping("/by-patient/{patientId}")
    public List<TestResult> getSessionsByPatient(@PathVariable Long patientId) {
        return testResultService.getResultsByPatientId(patientId);
    }
}
