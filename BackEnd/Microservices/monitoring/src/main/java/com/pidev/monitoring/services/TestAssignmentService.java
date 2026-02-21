package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.*;
import com.pidev.monitoring.repositories.CognitiveTestRepository;
import com.pidev.monitoring.repositories.TestAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TestAssignmentService {

    private final TestAssignmentRepository testAssignmentRepository;
    private final CognitiveTestRepository cognitiveTestRepository;

    // URL of the care service (same pattern as TestResultService)
    private static final String CARE_SERVICE_URL = "http://localhost:8081";

    public TestAssignmentService(TestAssignmentRepository testAssignmentRepository,
            CognitiveTestRepository cognitiveTestRepository) {
        this.testAssignmentRepository = testAssignmentRepository;
        this.cognitiveTestRepository = cognitiveTestRepository;
    }

    @Transactional
    public TestAssignment assignTest(Long testId, TestAssignment assignment) {
        CognitiveTest test = cognitiveTestRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found with id: " + testId));

        assignment.setTest(test);

        // Validation: TARGETED must have patientId, GENERAL must have targetSeverity
        if (assignment.getAssignmentType() == AssignmentType.TARGETED) {
            if (assignment.getPatientId() == null) {
                throw new IllegalArgumentException("patientId is required for TARGETED assignments");
            }
            assignment.setTargetSeverity(null); // clear the other field
        } else if (assignment.getAssignmentType() == AssignmentType.GENERAL) {
            if (assignment.getTargetSeverity() == null) {
                throw new IllegalArgumentException("targetSeverity is required for GENERAL assignments");
            }
            assignment.setPatientId(null); // clear the other field
        }

        test.getAssignments().add(assignment);
        cognitiveTestRepository.save(test);
        return assignment;
    }

    public TestAssignment getAssignmentById(Long id) {
        return testAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + id));
    }

    public List<TestAssignment> getAllAssignments() {
        return testAssignmentRepository.findAll();
    }

    /**
     * Returns all assignments visible to a patient:
     * 1. Assignments targeted directly at this patient (TARGETED + patientId)
     * 2. General assignments matching the patient's severity level from the care
     * service
     *
     * The patient's severity is fetched from the care service using patientId.
     */
    public List<TestAssignment> getAssignmentsForPatient(Long patientId) {
        // 1. Targeted assignments for this patient
        List<TestAssignment> targeted = testAssignmentRepository.findByPatientId(patientId);

        // 2. Fetch severity from the care service
        String severity = fetchPatientSeverity(patientId);
        List<TestAssignment> general = new ArrayList<>();
        if (severity != null) {
            try {
                SeverityTarget severityTarget = SeverityTarget.valueOf(severity.toUpperCase());
                general = testAssignmentRepository
                        .findByAssignmentTypeAndTargetSeverity(AssignmentType.GENERAL, severityTarget);
            } catch (IllegalArgumentException e) {
                System.err.println("Unknown severity value from care service: " + severity);
            }
        }

        // 3. Merge both lists
        List<TestAssignment> all = new ArrayList<>(targeted);
        all.addAll(general);
        return all;
    }

    /**
     * Calls the care microservice to get the severity of a patient by ID.
     * Returns the severity string (e.g. "HIGH") or null on failure.
     */
    @SuppressWarnings("unchecked")
    private String fetchPatientSeverity(Long patientId) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> patient = restTemplate.getForObject(
                    CARE_SERVICE_URL + "/patient/" + patientId,
                    Map.class);
            if (patient != null && patient.get("severity") != null) {
                return patient.get("severity").toString();
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch patient severity from care service: " + e.getMessage());
        }
        return null;
    }
}
