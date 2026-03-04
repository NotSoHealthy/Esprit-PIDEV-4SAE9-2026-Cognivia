package com.pidev.monitoring.services;

import com.lowagie.text.DocumentException;
import com.pidev.monitoring.dto.CaregiverReportDTO;
import com.pidev.monitoring.dto.ExternalMetricsDTO;
import com.pidev.monitoring.entities.RiskScore;
import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.repositories.RiskScoreRepository;
import com.pidev.monitoring.repositories.TestResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CaregiverReportService {

    private static final Logger log = LoggerFactory.getLogger(CaregiverReportService.class);

    private final TestResultRepository testResultRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final TemplateEngine templateEngine;
    private final WebClient webClient;

    private static final String CARE_SERVICE_URL = "http://localhost:8081";
    private static final String GAMES_SERVICE_URL = "http://localhost:8086";

    public CaregiverReportService(TestResultRepository testResultRepository,
            RiskScoreRepository riskScoreRepository,
            TemplateEngine templateEngine) {
        this.testResultRepository = testResultRepository;
        this.riskScoreRepository = riskScoreRepository;
        this.templateEngine = templateEngine;
        this.webClient = WebClient.builder().build();
    }

    public byte[] generatePatientReportPdf(Long patientId, String signatureBase64) throws IOException {
        log.info("Starting PDF generation for patient: {} with signature: {}", patientId,
                (signatureBase64 != null ? "present" : "absent"));
        try {
            CaregiverReportDTO reportData = aggregateReportData(patientId);

            Context context = new Context();
            context.setVariable("report", reportData);
            context.setVariable("signatureBase64", signatureBase64);

            String htmlContent = templateEngine.process("report", context);

            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                ITextRenderer renderer = new ITextRenderer();
                renderer.setDocumentFromString(htmlContent);
                renderer.layout();
                renderer.createPDF(outputStream);
                log.info("PDF generated successfully for patient: {}", patientId);
                return outputStream.toByteArray();
            }
        } catch (Exception e) {
            log.error("CRITICAL ERROR during PDF generation for patient {}: {}", patientId, e.getMessage(), e);
            throw new IOException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    private CaregiverReportDTO aggregateReportData(Long patientId) {
        log.info("Aggregating report data for patientId: {}", patientId);

        Map<String, Object> patientInfo = fetchPatientInfo(patientId);
        String patientName = (patientInfo != null && patientInfo.get("firstName") != null)
                ? (patientInfo.get("firstName") + " " + patientInfo.get("lastName")).trim()
                : "Active Patient #" + patientId;

        Optional<RiskScore> latestRisk = riskScoreRepository.findTopByPatientIdOrderByGeneratedAtDesc(patientId);

        // Filter tests done this week (Monday to Sunday)
        java.time.LocalDate now = java.time.LocalDate.now();
        java.time.LocalDate monday = now.with(java.time.DayOfWeek.MONDAY);
        java.time.LocalDate sunday = now.with(java.time.DayOfWeek.SUNDAY);

        List<TestResult> recentResults = testResultRepository.findByPatientId(patientId).stream()
                .filter(r -> r.getTakenAt() != null)
                .filter(r -> {
                    java.time.LocalDate takenDate = r.getTakenAt().toLocalDate();
                    return (takenDate.isEqual(monday) || takenDate.isAfter(monday)) &&
                            (takenDate.isEqual(sunday) || takenDate.isBefore(sunday));
                })
                .sorted((a, b) -> b.getTakenAt().compareTo(a.getTakenAt()))
                .limit(10) // Show up to 10 for the week
                .collect(Collectors.toList());

        ExternalMetricsDTO gameMetrics = fetchGameMetrics(patientId);
        if (gameMetrics == null) {
            gameMetrics = new ExternalMetricsDTO(); // Empty default to prevent NPE
        }

        String summary = generateNaturalLanguageSummary(patientName, latestRisk, recentResults);

        return CaregiverReportDTO.builder()
                .patientId(patientId)
                .patientName(patientName)
                .currentRiskValue(latestRisk.map(r -> (int) Math.round(r.getRiskValue())).orElse(0))
                .riskLevel(latestRisk.map(RiskScore::getRiskLevel).orElse("INITIAL"))
                .clinicalSummary(summary)
                .recentScores(recentResults != null ? recentResults.stream()
                        .map(r -> CaregiverReportDTO.TestScoreDetail.builder()
                                .testName(r.getTest() != null ? r.getTest().getTitle() : "Cognitive Test")
                                .score(r.getScore())
                                .date(r.getTakenAt() != null
                                        ? r.getTakenAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                                        : "N/A")
                                .build())
                        .collect(Collectors.toList()) : List.of())
                .unityMetrics(CaregiverReportDTO.ExternalGameMetrics.builder()
                        .avgResponseTime(gameMetrics.getAverageResponseTime())
                        .sessionsCompleted(gameMetrics.getTotalGamesPlayed())
                        .performanceTrend(
                                (gameMetrics.getAverageResponseTime() > 0)
                                        ? (gameMetrics.getAverageResponseTime() < 2000 ? "Highly Responsive" : "Stable")
                                        : "Baseline Establishing")
                        .build())
                .build();
    }

    private String generateNaturalLanguageSummary(String name, Optional<RiskScore> risk, List<TestResult> results) {
        if (results.isEmpty())
            return "No clinical data has been recorded for " + name
                    + " yet. We recommend completing the initial cognitive baseline tests.";

        double avg = results.stream().mapToDouble(TestResult::getScore).average().orElse(0.0);
        String riskLvl = risk.map(RiskScore::getRiskLevel).orElse("INITIAL");

        StringBuilder nlg = new StringBuilder();
        nlg.append("Based on the latest clinical assessments, ").append(name)
                .append("'s cognitive health profile is currently categorized as ")
                .append(riskLvl.toLowerCase()).append(". ");

        if (avg >= 75) {
            nlg.append("The patient shows strong performance across most memory and reaction tasks. ");
        } else if (avg >= 40) {
            nlg.append("Performance is within the expected range, though periodic monitoring is advised. ");
        } else {
            nlg.append(
                    "We have observed lower engagement in recent sessions, which may warrant further clinical review. ");
        }

        return nlg.toString();
    }

    private Map<String, Object> fetchPatientInfo(Long patientId) {
        try {
            return webClient.get()
                    .uri(CARE_SERVICE_URL + "/patient/" + patientId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(java.time.Duration.ofSeconds(2));
        } catch (Exception e) {
            log.error("Failed to fetch patient info: {}", e.getMessage());
            return null;
        }
    }

    private ExternalMetricsDTO fetchGameMetrics(Long patientId) {
        try {
            return webClient.get()
                    .uri(GAMES_SERVICE_URL + "/game-metrics/patient/" + patientId)
                    .retrieve()
                    .bodyToMono(ExternalMetricsDTO.class)
                    .block(java.time.Duration.ofSeconds(2));
        } catch (Exception e) {
            log.error("Failed to fetch game metrics for report: {}", e.getMessage());
            return null;
        }
    }
}
