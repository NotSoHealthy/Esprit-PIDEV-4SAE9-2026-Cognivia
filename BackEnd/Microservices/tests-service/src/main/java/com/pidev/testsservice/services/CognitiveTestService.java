package com.pidev.testsservice.services;

import com.pidev.testsservice.entities.CognitiveTest;
import com.pidev.testsservice.entities.TestQuestion;
import com.pidev.testsservice.repositories.CognitiveTestRepository;
import com.pidev.testsservice.repositories.TestQuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CognitiveTestService {

    private final CognitiveTestRepository cognitiveTestRepository;
    private final TestQuestionRepository testQuestionRepository;

    public CognitiveTestService(CognitiveTestRepository cognitiveTestRepository,
            TestQuestionRepository testQuestionRepository) {
        this.cognitiveTestRepository = cognitiveTestRepository;
        this.testQuestionRepository = testQuestionRepository;
    }

    public List<CognitiveTest> getAllTests() {
        return cognitiveTestRepository.findAll();
    }

    public CognitiveTest getTestById(Long id) {
        return cognitiveTestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test not found with id: " + id));
    }

    public CognitiveTest createTest(CognitiveTest test) {
        if (test.getQuestions() != null) {
            test.getQuestions().forEach(q -> q.setTest(test));
        }
        return cognitiveTestRepository.save(test);
    }

    @Transactional
    public CognitiveTest addQuestionToTest(Long testId, TestQuestion question) {
        CognitiveTest test = getTestById(testId);
        question.setTest(test);
        test.getQuestions().add(question);
        return cognitiveTestRepository.save(test);
    }

    @Transactional
    public CognitiveTest updateTest(Long id, CognitiveTest testUpdates) {
        CognitiveTest existingTest = getTestById(id);
        existingTest.setTitle(testUpdates.getTitle());
        existingTest.setDescription(testUpdates.getDescription());

        // Clear existing questions to avoid orphans or handle updates properly
        // In a real scenario, we might want to reconcile them, but for simplicity here
        // we re-set
        if (testUpdates.getQuestions() != null) {
            // Remove old questions back-references
            existingTest.getQuestions().forEach(q -> q.setTest(null));
            existingTest.getQuestions().clear();

            // Add new/updated questions
            testUpdates.getQuestions().forEach(q -> {
                q.setTest(existingTest);
                existingTest.getQuestions().add(q);
            });
        }

        return cognitiveTestRepository.save(existingTest);
    }
}
