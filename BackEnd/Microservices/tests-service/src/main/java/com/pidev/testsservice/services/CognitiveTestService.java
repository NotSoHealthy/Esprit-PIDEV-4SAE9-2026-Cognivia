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
            test.getQuestions().forEach(q -> {
                q.setTest(test);
                if (q.getOptions() != null) {
                    q.getOptions().forEach(opt -> opt.setQuestion(q));
                }
            });
        }
        return cognitiveTestRepository.save(test);
    }

    @Transactional
    public CognitiveTest addQuestionToTest(Long testId, TestQuestion question) {
        CognitiveTest test = getTestById(testId);
        question.setTest(test);
        if (question.getOptions() != null) {
            question.getOptions().forEach(opt -> opt.setQuestion(question));
        }
        test.getQuestions().add(question);
        return cognitiveTestRepository.save(test);
    }

    @Transactional
    public CognitiveTest updateTest(Long id, CognitiveTest testUpdates) {
        CognitiveTest existingTest = getTestById(id);
        existingTest.setTitle(testUpdates.getTitle());
        existingTest.setDescription(testUpdates.getDescription());

        if (testUpdates.getQuestions() != null) {
            // Remove old questions back-references
            existingTest.getQuestions().forEach(q -> q.setTest(null));
            existingTest.getQuestions().clear();

            // Add new/updated questions with proper back-references
            testUpdates.getQuestions().forEach(q -> {
                q.setTest(existingTest);
                if (q.getOptions() != null) {
                    q.getOptions().forEach(opt -> opt.setQuestion(q));
                }
                existingTest.getQuestions().add(q);
            });
        }

        return cognitiveTestRepository.save(existingTest);
    }

    @Transactional
    public void deleteTest(Long id) {
        cognitiveTestRepository.deleteById(id);
    }
}
