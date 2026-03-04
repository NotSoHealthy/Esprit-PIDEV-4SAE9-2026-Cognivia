package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.TestAssignment;
import com.pidev.monitoring.entities.AssignmentType;
import com.pidev.monitoring.entities.CognitiveTest;
import com.pidev.monitoring.entities.Frequency;
import com.pidev.monitoring.entities.SeverityTarget;
import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.repositories.CognitiveTestRepository;
import com.pidev.monitoring.repositories.TestAssignmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class TestAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(TestAssignmentService.class);

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
        assignment.setAssignedAt(LocalDateTime.now());

        // Expiration logic: Recurring tests should not expire daily
        if (assignment.getFrequency() != null && assignment.getFrequency() != Frequency.ONCE) {
            assignment.setDueAt(assignment.getAssignedAt().plusYears(1)); // 1 year window for recurring
        } else {
            assignment.setDueAt(assignment.getAssignedAt().plusDays(1)); // 1 day completion window for ONCE
        }

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

    @Transactional(readOnly = true)
    public TestAssignment getAssignmentById(Long id) {
        return testAssignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + id));
    }

    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<TestAssignment> getAssignmentsForPatient(Long patientId) {
        log.info("Fetching assignments for patientId: {}", patientId);
        // 1. Targeted assignments for this patient
        List<TestAssignment> targeted = testAssignmentRepository.findByPatientId(patientId);
        log.debug("Found {} targeted assignments", targeted.size());

        // 2. Fetch severity from the care service
        String severity = fetchPatientSeverity(patientId);
        log.debug("Fetched patient severity: {}", severity);
        List<TestAssignment> general = new ArrayList<>();
        if (severity != null) {
            try {
                SeverityTarget severityTarget = SeverityTarget.valueOf(severity.toUpperCase());
                general = testAssignmentRepository
                        .findByAssignmentTypeAndTargetSeverity(AssignmentType.GENERAL, severityTarget);
                log.debug("Found {} general assignments for severity {}", general.size(), severityTarget);
            } catch (IllegalArgumentException e) {
                log.error("Unknown severity value from care service: {}", severity);
            }
        }

        // 3. Merge both lists
        List<TestAssignment> all = new ArrayList<>(targeted);
        all.addAll(general);
        log.debug("Total assignments before filtering: {}", all.size());

        LocalDateTime now = LocalDateTime.now();

        // 4. Filter out assignments that are completed OR expired
        List<TestAssignment> filtered = all.stream()
                .filter(assignment -> {
                    boolean notExpired = assignment.getDueAt() != null && now.isBefore(assignment.getDueAt());
                    if (!notExpired)
                        log.trace("Assignment {} filtered out: expired or null dueAt", assignment.getId());
                    return notExpired;
                })
                .filter(assignment -> {
                    boolean notCompleted = !isAssignmentCompletedByPatient(assignment, patientId);
                    if (!notCompleted)
                        log.trace("Assignment {} filtered out: already completed", assignment.getId());
                    return notCompleted;
                })
                .toList();

        log.info("Returning {} assignments for patientId: {}", filtered.size(), patientId);
        return filtered;
    }

    /**
     * Checks if a patient has already submitted a result for a specific
     * assignment.
     */
    private boolean isAssignmentCompletedByPatient(TestAssignment assignment, Long patientId) {
        if (assignment.getResults() == null || assignment.getResults().isEmpty()) {
            return false;
        }

        // Get the latest result for this specific patient
        LocalDateTime lastCompletion = assignment.getResults().stream()
                .filter(result -> patientId.equals(result.getPatientId()))
                .map(TestResult::getTakenAt)
                .filter(java.util.Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        if (lastCompletion == null) {
            return false;
        }

        Frequency freq = assignment.getFrequency();
        if (freq == null)
            freq = Frequency.ONCE;

        LocalDateTime now = LocalDateTime.now();

        return switch (freq) {
            case ONCE -> true; // If they have any result, it's done
            case DAILY -> lastCompletion.toLocalDate().isEqual(now.toLocalDate());
            case WEEKLY -> lastCompletion.isAfter(now.minusDays(7));
            case MONTHLY -> lastCompletion.isAfter(now.minusDays(30));
        };
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
            log.error("Failed to fetch patient severity from care service for patient {}: {}", patientId,
                    e.getMessage());
        }
        return null;
    }
}
