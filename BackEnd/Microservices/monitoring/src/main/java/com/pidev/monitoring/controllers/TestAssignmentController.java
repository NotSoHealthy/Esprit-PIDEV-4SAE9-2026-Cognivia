package com.pidev.monitoring.controllers;

import com.pidev.monitoring.entities.TestAssignment;
import com.pidev.monitoring.services.TestAssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assignments")
public class TestAssignmentController {

    private final TestAssignmentService testAssignmentService;

    public TestAssignmentController(TestAssignmentService testAssignmentService) {
        this.testAssignmentService = testAssignmentService;
    }

    /** Doctor: assign a test (targeted to a patient OR general by severity) */
    @PostMapping("/test/{testId}")
    public TestAssignment assignTest(@PathVariable Long testId, @RequestBody TestAssignment assignment) {
        return testAssignmentService.assignTest(testId, assignment);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestAssignment> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(testAssignmentService.getAssignmentById(id));
    }

    /** Doctor: view all assignments */
    @GetMapping
    public List<TestAssignment> getAllAssignments() {
        return testAssignmentService.getAllAssignments();
    }

    /**
     * Patient: fetch all assignments visible to them.
     * The service internally resolves the patient's severity from the care service.
     */
    @GetMapping("/for-patient/{patientId}")
    public List<TestAssignment> getAssignmentsForPatient(@PathVariable Long patientId) {
        return testAssignmentService.getAssignmentsForPatient(patientId);
    }
}
