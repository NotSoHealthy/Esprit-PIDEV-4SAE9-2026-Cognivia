package com.pidev.monitoring.controllers;

import com.pidev.monitoring.entities.CognitiveTest;
import com.pidev.monitoring.entities.TestQuestion;
import com.pidev.monitoring.services.CognitiveTestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tests")
public class CognitiveTestController {

    private final CognitiveTestService cognitiveTestService;

    public CognitiveTestController(CognitiveTestService cognitiveTestService) {
        this.cognitiveTestService = cognitiveTestService;
    }

    @GetMapping
    public List<CognitiveTest> getAllTests() {
        return cognitiveTestService.getAllTests();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CognitiveTest> getTestById(@PathVariable Long id) {
        return ResponseEntity.ok(cognitiveTestService.getTestById(id));
    }

    @PostMapping
    public CognitiveTest createTest(@RequestBody CognitiveTest test) {
        return cognitiveTestService.createTest(test);
    }

    @PutMapping("/{id}")
    public CognitiveTest updateTest(@PathVariable Long id, @RequestBody CognitiveTest test) {
        return cognitiveTestService.updateTest(id, test);
    }

    @PostMapping("/{id}/questions")
    public CognitiveTest addQuestionToTest(@PathVariable Long id, @RequestBody TestQuestion question) {
        return cognitiveTestService.addQuestionToTest(id, question);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        cognitiveTestService.deleteTest(id);
        return ResponseEntity.noContent().build();
    }
}
