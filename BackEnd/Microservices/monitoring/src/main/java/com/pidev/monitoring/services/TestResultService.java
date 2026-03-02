package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.*;
import com.pidev.monitoring.dto.ExternalMetricsDTO;
import com.pidev.monitoring.repositories.CognitiveTestRepository;
import com.pidev.monitoring.repositories.RiskScoreRepository;
import com.pidev.monitoring.repositories.TestAssignmentRepository;
import com.pidev.monitoring.repositories.TestQuestionRepository;
import com.pidev.monitoring.repositories.TestResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TestResultService {

    private static final Logger log = LoggerFactory.getLogger(TestResultService.class);

    private final TestResultRepository testResultRepository;
    private final TestAssignmentRepository testAssignmentRepository;
    private final CognitiveTestRepository cognitiveTestRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final RiskScoreRepository riskScoreRepository;

    public TestResultService(TestResultRepository testResultRepository,
            TestAssignmentRepository testAssignmentRepository,
            CognitiveTestRepository cognitiveTestRepository,
            TestQuestionRepository testQuestionRepository,
            RiskScoreRepository riskScoreRepository) {
        this.testResultRepository = testResultRepository;
        this.testAssignmentRepository = testAssignmentRepository;
        this.cognitiveTestRepository = cognitiveTestRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.riskScoreRepository = riskScoreRepository;
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
        log.info("Submitting result for assignmentId: {}", assignmentId);
        TestAssignment assignment = testAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + assignmentId));

        result.setAssignment(assignment);
        result.setTest(assignment.getTest());

        // Always ensure patientId is set on the result
        if (result.getPatientId() == null && assignment.getAssignmentType() == AssignmentType.TARGETED) {
            result.setPatientId(assignment.getPatientId());
        }

        log.info("Calculating score for result...");
        calculateScore(result);

        log.info("Saving test result (score: {})...", result.getScore());
        TestResult savedResult = testResultRepository.saveAndFlush(result);

        log.info("Generating risk for patientId: {}", savedResult.getPatientId());
        generateAndSaveRisk(savedResult);

        log.info("Result submission completed successfully.");
        return savedResult;
    }

    @Transactional
    public TestResult submitDirectResult(Long testId, TestResult result) {
        CognitiveTest test = cognitiveTestRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found with id: " + testId));

        result.setTest(test);
        calculateScore(result);

        TestResult savedResult = testResultRepository.save(result);
        generateAndSaveRisk(savedResult);
        return savedResult;
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

    /**
     * AI-DRIVEN: Longitudinal Time-Series Risk Analysis.
     * 
     * Requirement:
     * 1. Fetch last 30 days of data from Monitoring & Games.
     * 2. Calculate Rate of Change (Slope).
     * 3. Generate ClinicalFlag on excessive performance drop.
     */
    private void generateAndSaveRisk(TestResult result) {
        Long patientId = result.getPatientId();
        if (patientId == null)
            patientId = 1L;

        java.time.LocalDateTime thirtyDaysAgo = java.time.LocalDateTime.now().minusDays(30);

        // STAGE 1: Fetch 30-day internal data
        List<TestResult> thirtyDayResults = testResultRepository
                .findAllByPatientIdAndTakenAtAfterOrderByTakenAtDesc(patientId, thirtyDaysAgo);

        // STAGE 2: Fetch 30-day external game data (Unity)
        ExternalMetricsDTO gameMetrics = fetchGameMetricsForPatient(patientId);
        double gameFactor = (gameMetrics != null) ? gameMetrics.getAverageResponseTime() : 0.0;
        boolean externalDataUsed = (gameMetrics != null);

        // STAGE 3: Calculate Slope (Rate of Change)
        double slope = calculatePerformanceSlope(thirtyDayResults);

        // STAGE 4: Calculate Weighted Risk Value
        double currentScore = result.getScore() != null ? result.getScore() : 0.0;
        double weightedAvg = thirtyDayResults.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0.0)
                .average().orElse(currentScore);

        double baseRisk = 100.0 - weightedAvg;

        // Penalty for high response time in Unity games (normalized)
        if (gameFactor > 5000)
            baseRisk += 5.0; // Significant delay penalty

        // STAGE 5: Clinical Flagging Logic
        boolean clinicalFlag = false;
        if (slope < -15.0 || (baseRisk > 70 && slope < -5.0)) {
            clinicalFlag = true;
            log.warn("CLINICAL ALERT: Significant cognitive drop detected for patient {}", patientId);
        }

        String riskLevel = (baseRisk > 70) ? "HIGH" : (baseRisk > 30) ? "MEDIUM" : "LOW";
        String trend = (slope > 2) ? "IMPROVING" : (slope < -2) ? "DECLINING" : "STABLE";

        // Fetch previous for comparison
        Optional<RiskScore> prev = riskScoreRepository.findTopByPatientIdOrderByGeneratedAtDesc(patientId);

        RiskScore riskScore = RiskScore.builder()
                .patientId(patientId)
                .riskValue(Math.round(baseRisk * 100.0) / 100.0)
                .riskLevel(riskLevel)
                .trendDirection(trend)
                .averageScore(Math.round(weightedAvg * 100.0) / 100.0)
                .scoreCount(thirtyDayResults.size())
                .slopeValue(Math.round(slope * 100.0) / 100.0)
                .clinicalFlag(clinicalFlag)
                .externalGameDataUsed(externalDataUsed)
                .previousRiskValue(prev.map(RiskScore::getRiskValue).orElse(null))
                .build();

        riskScoreRepository.save(riskScore);
        log.info("AI Analysis Complete for patient {}: Slope={}, Flag={}", patientId, slope, clinicalFlag);
    }

    private ExternalMetricsDTO fetchGameMetricsForPatient(Long patientId) {
        try {
            org.springframework.web.reactive.function.client.WebClient webClient = org.springframework.web.reactive.function.client.WebClient
                    .create("http://localhost:8086");
            return webClient.get()
                    .uri("/game-metrics/patient/" + patientId)
                    .retrieve()
                    .bodyToMono(ExternalMetricsDTO.class)
                    .block(java.time.Duration.ofSeconds(2));
        } catch (Exception e) {
            log.error("Failed to fetch game metrics: {}", e.getMessage());
            return null;
        }
    }

    private double calculatePerformanceSlope(List<TestResult> results) {
        if (results == null || results.size() < 2)
            return 0.0;

        // Simple linear regression approximation: (Newest - Oldest) / Time
        double newest = results.get(0).getScore() != null ? results.get(0).getScore() : 0.0;
        double oldest = results.get(results.size() - 1).getScore() != null ? results.get(results.size() - 1).getScore()
                : 0.0;

        return newest - oldest; // Simplified slope: total change over 30 days
    }

    public List<TestResult> getResultsByPatientId(Long patientId) {
        return testResultRepository.findByPatientId(patientId);
    }
}
