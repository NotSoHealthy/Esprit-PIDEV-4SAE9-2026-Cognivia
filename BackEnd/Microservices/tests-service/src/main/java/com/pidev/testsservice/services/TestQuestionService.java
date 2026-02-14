package com.pidev.testsservice.services;

import com.pidev.testsservice.entities.TestQuestion;
import com.pidev.testsservice.repositories.TestQuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TestQuestionService {

    private final TestQuestionRepository testQuestionRepository;
    private final CognitiveTestService cognitiveTestService;

    public TestQuestionService(TestQuestionRepository testQuestionRepository,
            CognitiveTestService cognitiveTestService) {
        this.testQuestionRepository = testQuestionRepository;
        this.cognitiveTestService = cognitiveTestService;
    }

    public List<TestQuestion> getAllQuestions() {
        return testQuestionRepository.findAll();
    }

    public TestQuestion getQuestionById(Long id) {
        return testQuestionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + id));
    }

    public List<TestQuestion> getQuestionsByTestId(Long testId) {
        return cognitiveTestService.getTestById(testId).getQuestions();
    }

    @Transactional
    public TestQuestion createQuestion(TestQuestion question) {
        return testQuestionRepository.save(question);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        testQuestionRepository.deleteById(id);
    }
}
