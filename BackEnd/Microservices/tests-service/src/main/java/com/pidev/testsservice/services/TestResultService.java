package com.pidev.testsservice.services;

import com.pidev.testsservice.entities.*;
import com.pidev.testsservice.repositories.CognitiveTestRepository;
import com.pidev.testsservice.repositories.TestAssignmentRepository;
import com.pidev.testsservice.repositories.TestQuestionRepository;
import com.pidev.testsservice.repositories.TestResultRepository;
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
    }
}
