package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.*;
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
     * UPGRADED: Longitudinal Trend-Based Risk Analysis.
     *
     * Instead of a simple `100 - score`, this algorithm:
     * 1. Fetches the last 5 test results for the patient.
     * 2. Computes a WEIGHTED average (recent results carry more weight).
     * 3. Determines TREND DIRECTION by comparing recent vs. older performance.
     * 4. Adjusts the risk level based on both the weighted average and the trend.
     */
    private void generateAndSaveRisk(TestResult result) {
        Long patientId = result.getPatientId();
        if (patientId == null) {
            patientId = 1L; // Fallback for demo/direct tests
        }

        double currentScore = result.getScore() != null ? result.getScore() : 0.0;

        log.info("Fetching recent results for patientId: {}", patientId);
        // Step 1: Fetch the last 5 results (including the one just saved)
        List<TestResult> recentResults = testResultRepository
                .findTop5ByPatientIdOrderByTakenAtDesc(patientId);

        // Safety check: ensure we have at least this current result even if DB hasn't
        // flushed
        if (recentResults == null || recentResults.isEmpty()) {
            log.warn("No recent results found in DB for patient {}, using current result only", patientId);
            recentResults = List.of(result);
        }

        log.info("Found {} recent results for analysis", recentResults.size());

        int scoreCount = recentResults.size();

        // Step 2: Weighted average — recent scores count more
        double[] weights = { 3.0, 2.5, 2.0, 1.5, 1.0 };
        double weightedSum = 0;
        double totalWeight = 0;

        for (int i = 0; i < recentResults.size(); i++) {
            double w = (i < weights.length) ? weights[i] : 1.0;
            double s = recentResults.get(i).getScore() != null ? recentResults.get(i).getScore() : 0.0;
            weightedSum += s * w;
            totalWeight += w;
        }

        double weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : currentScore;

        // Step 3: Trend detection
        String trendDirection = "STABLE";

        if (scoreCount >= 2) { // Minimal trend detection from 2 sessions
            double newest = recentResults.get(0).getScore() != null ? recentResults.get(0).getScore() : 0.0;
            double previous = recentResults.get(1).getScore() != null ? recentResults.get(1).getScore() : 0.0;

            double diff = newest - previous;
            if (diff > 5.0)
                trendDirection = "IMPROVING";
            else if (diff < -5.0)
                trendDirection = "DECLINING";
            else
                trendDirection = "STABLE";
        }

        // ────────────────────────────────────────────────────
        // Step 4: Risk calculation with trend adjustment
        // ────────────────────────────────────────────────────
        double riskValue = 100.0 - weightedAverage;

        // Trend adjustment: improving patients get a small risk reduction,
        // declining patients get a risk increase
        if ("IMPROVING".equals(trendDirection)) {
            riskValue = Math.max(0, riskValue - 5.0);
        } else if ("DECLINING".equals(trendDirection)) {
            riskValue = Math.min(100, riskValue + 5.0);
        }

        String riskLevel;
        if (riskValue <= 20) {
            riskLevel = "LOW";
        } else if (riskValue <= 50) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "HIGH";
        }

        // Get previous risk for comparison
        log.info("Fetching previous risk for patientId: {}", patientId);
        Optional<RiskScore> previousRisk = riskScoreRepository
                .findTopByPatientIdOrderByGeneratedAtDesc(patientId);
        Double previousRiskValue = previousRisk.map(RiskScore::getRiskValue).orElse(null);

        // ────────────────────────────────────────────────────
        // Step 5: Save the enriched risk score
        // ────────────────────────────────────────────────────
        RiskScore riskScore = RiskScore.builder()
                .patientId(patientId)
                .riskValue(Math.round(riskValue * 100.0) / 100.0) // Round to 2 decimals
                .riskLevel(riskLevel)
                .trendDirection(trendDirection)
                .averageScore(Math.round(weightedAverage * 100.0) / 100.0)
                .scoreCount(scoreCount)
                .previousRiskValue(previousRiskValue)
                .build();

        log.info("Saving newly generated risk score...");
        riskScoreRepository.save(riskScore);

        log.info("Risk generated for patient {}: risk={}, level={}, trend={}, avg={}, based on {} tests",
                patientId, riskScore.getRiskValue(), riskLevel, trendDirection,
                weightedAverage, scoreCount);
    }

    public List<TestResult> getResultsByPatientId(Long patientId) {
        return testResultRepository.findByPatientId(patientId);
    }
}
