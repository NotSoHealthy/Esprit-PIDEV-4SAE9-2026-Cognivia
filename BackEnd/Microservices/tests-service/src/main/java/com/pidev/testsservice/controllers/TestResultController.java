package com.pidev.testsservice.controllers;

import com.pidev.testsservice.entities.TestResult;
import com.pidev.testsservice.services.TestResultService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/results")
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
}
