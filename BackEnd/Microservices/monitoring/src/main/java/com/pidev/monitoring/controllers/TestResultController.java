package com.pidev.monitoring.controllers;

import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.services.TestResultService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/results")
public class TestResultController {

    private final TestResultService testResultService;

    public TestResultController(TestResultService testResultService) {
        this.testResultService = testResultService;
    }

    @PostMapping("/assignment/{assignmentId}")
    public TestResult submitResult(@PathVariable Long assignmentId, @RequestBody TestResult result) {
        return testResultService.submitResult(assignmentId, result);
    }

    @PostMapping("/test/{testId}")
    public TestResult submitDirectResult(@PathVariable Long testId, @RequestBody TestResult result) {
        return testResultService.submitDirectResult(testId, result);
    }

    @GetMapping
    public List<TestResult> getAllResults() {
        return testResultService.getAllResults();
    }

    @GetMapping("/{id}")
    public TestResult getResultById(@PathVariable Long id) {
        return testResultService.getResultById(id);
    }

    @GetMapping("/assignment/{assignmentId}")
    public TestResult getResultByAssignment(@PathVariable Long assignmentId) {
        return testResultService.getResultByAssignmentId(assignmentId);
    }
}
