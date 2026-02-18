package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.*;
import com.pidev.monitoring.repositories.CognitiveTestRepository;
import com.pidev.monitoring.repositories.TestAssignmentRepository;
import com.pidev.monitoring.repositories.TestQuestionRepository;
import com.pidev.monitoring.repositories.TestResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TestResultService {

    private final TestResultRepository testResultRepository;
    private final TestAssignmentRepository testAssignmentRepository;
    private final CognitiveTestRepository cognitiveTestRepository;
    private final TestQuestionRepository testQuestionRepository;

    public TestResultService(TestResultRepository testResultRepository,
            TestAssignmentRepository testAssignmentRepository,
            CognitiveTestRepository cognitiveTestRepository,
            TestQuestionRepository testQuestionRepository) {
        this.testResultRepository = testResultRepository;
        this.testAssignmentRepository = testAssignmentRepository;
        this.cognitiveTestRepository = cognitiveTestRepository;
        this.testQuestionRepository = testQuestionRepository;
    }

    public List<TestResult> getAllResults() {
        return testResultRepository.findAll();
    }

    public TestResult getResultById(Long id) {
        return testResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Result not found with id: " + id));
    }

    @Transactional
    public TestResult submitResult(Long assignmentId, TestResult result) {
        TestAssignment assignment = testAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + assignmentId));

        result.setAssignment(assignment);
        result.setTest(assignment.getTest());
        calculateScore(result);

        return testResultRepository.save(result);
    }

    @Transactional
    public TestResult submitDirectResult(Long testId, TestResult result) {
        CognitiveTest test = cognitiveTestRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found with id: " + testId));

        result.setTest(test);
        calculateScore(result);

        return testResultRepository.save(result);
    }

    private void calculateScore(TestResult result) {
        List<TestAnswer> answers = result.getAnswers();
        if (answers == null || answers.isEmpty()) {
            result.setScore(0.0);
            return;
        }

        int correctCount = 0;
        for (TestAnswer answer : answers) {
            // Resolve question if it's only an ID shell from JSON
            TestQuestion question = answer.getQuestion();
            if (question != null && question.getId() != null) {
                question = testQuestionRepository.findById(question.getId())
                        .orElseThrow(() -> new RuntimeException(
                                "Question not found with id: " + answer.getQuestion().getId()));
                answer.setQuestion(question);
            }

            if (question == null)
                continue;

            if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
                MultipleChoiceOption selected = answer.getSelectedOption();
                // Resolve option from question's options if needed
                if (selected != null && selected.getId() != null) {
                    Long selectedId = selected.getId();
                    selected = question.getOptions().stream()
                            .filter(o -> o.getId().equals(selectedId))
                            .findFirst()
                            .orElse(null);
                    answer.setSelectedOption(selected);
                }

                if (selected != null && selected.isCorrect()) {
                    answer.setCorrect(true);
                    correctCount++;
                } else {
                    answer.setCorrect(false);
                }
            } else if (question.getQuestionType() == QuestionType.SIMPLE) {
                String correct = question.getCorrectAnswer();
                if (correct != null && correct.trim()
                        .equalsIgnoreCase(answer.getAnswerText() != null ? answer.getAnswerText().trim() : "")) {
                    answer.setCorrect(true);
                    correctCount++;
                } else {
                    answer.setCorrect(false);
                }
            }
            answer.setResult(result);
        }

        double score = ((double) correctCount / answers.size()) * 100.0;
        result.setScore(score);

        // Generate and save Risk Score (Fire and forget or sync)
        try {
            generateAndSaveRisk(result, score);
        } catch (Exception e) {
            System.err.println("Failed to generate risk: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void generateAndSaveRisk(TestResult result, double score) {
        String riskLevel;
        double riskValue = 100.0 - score; // Risk is inverse of score (high score = low risk)

        if (score > 80) {
            riskLevel = "LOW";
        } else if (score >= 50) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "HIGH";
        }

        // We need a patientId. If TestResult doesn't have it, we might defaults or
        // skip.
        // Assuming TestResult has patientId or we get it from Assignment -> User
        Long patientId = result.getPatientId();
        if (patientId == null) {
            // Default to 1L for demo purposes if no patient attached (direct test)
            patientId = 1L;
        }

        if (patientId == null)
            return;

        // Create payload
        java.util.Map<String, Object> riskPayload = new java.util.HashMap<>();
        riskPayload.put("patientId", patientId);
        riskPayload.put("riskValue", riskValue);
        riskPayload.put("riskLevel", riskLevel);

        // Call Risk Service
        String riskServiceUrl = "http://localhost:8082/risk";
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        restTemplate.postForEntity(riskServiceUrl, riskPayload, Object.class);
    }

    public List<TestResult> getResultsByPatientId(Long patientId) {
        return testResultRepository.findByPatientId(patientId);
    }
}
