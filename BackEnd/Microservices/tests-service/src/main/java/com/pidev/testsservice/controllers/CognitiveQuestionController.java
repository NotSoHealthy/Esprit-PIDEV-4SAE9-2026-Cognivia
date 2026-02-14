package com.pidev.testsservice.controllers;

import com.pidev.testsservice.entities.TestQuestion;
import com.pidev.testsservice.services.TestQuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/questions")
public class CognitiveQuestionController {

    private final TestQuestionService testQuestionService;

    public CognitiveQuestionController(TestQuestionService testQuestionService) {
        this.testQuestionService = testQuestionService;
    }

    @PostMapping
    public TestQuestion createQuestion(@RequestBody TestQuestion question) {
        return testQuestionService.createQuestion(question);
    }

    @GetMapping
    public List<TestQuestion> getAllQuestions() {
        return testQuestionService.getAllQuestions();
    }

    @GetMapping("/by-test/{testId}")
    public List<TestQuestion> getQuestionsByTest(@PathVariable Long testId) {
        return testQuestionService.getQuestionsByTestId(testId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        testQuestionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
