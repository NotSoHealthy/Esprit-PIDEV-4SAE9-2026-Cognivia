package com.pidev.testsservice.controllers;

import com.pidev.testsservice.entities.TestAssignment;
import com.pidev.testsservice.services.TestAssignmentService;
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

    @PostMapping("/test/{testId}")
    public TestAssignment assignTest(@PathVariable Long testId, @RequestBody TestAssignment assignment) {
        return testAssignmentService.assignTest(testId, assignment);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestAssignment> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(testAssignmentService.getAssignmentById(id));
    }

    @GetMapping
    public List<TestAssignment> getAllAssignments() {
        return testAssignmentService.getAllAssignments();
    }
}
