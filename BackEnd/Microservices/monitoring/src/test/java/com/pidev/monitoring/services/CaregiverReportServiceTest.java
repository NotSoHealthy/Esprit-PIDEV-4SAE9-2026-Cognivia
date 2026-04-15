package com.pidev.monitoring.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.pidev.monitoring.dto.CaregiverReportDTO;
import com.pidev.monitoring.entities.CognitiveTest;
import com.pidev.monitoring.entities.RiskScore;
import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.repositories.RiskScoreRepository;
import com.pidev.monitoring.repositories.TestResultRepository;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class CaregiverReportServiceTest {

    @Mock
    private TestResultRepository testResultRepository;

    @Mock
    private RiskScoreRepository riskScoreRepository;

    @Mock
    private TemplateEngine templateEngine;

    @Test
    void generatePatientReportPdf_success_capturesAggregatedReportData() throws Exception {
        long patientId = 1L;

        RiskScore risk = new RiskScore();
        risk.setPatientId(patientId);
        risk.setRiskValue(12.7);
        risk.setRiskLevel("HIGH");
        when(riskScoreRepository.findTopByPatientIdOrderByGeneratedAtDesc(patientId)).thenReturn(Optional.of(risk));

        TestResult insideWeek = new TestResult();
        insideWeek.setPatientId(patientId);
        insideWeek.setScore(80.0);
        LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
        insideWeek.setTakenAt(monday.atTime(12, 0));
        CognitiveTest test = new CognitiveTest();
        test.setTitle("Memory");
        insideWeek.setTest(test);

        TestResult outsideWeek = new TestResult();
        outsideWeek.setPatientId(patientId);
        outsideWeek.setScore(10.0);
        outsideWeek.setTakenAt(monday.minusWeeks(2).atTime(12, 0));

        when(testResultRepository.findByPatientId(patientId)).thenReturn(List.of(outsideWeek, insideWeek));

        WebClient webClient = WebClient.builder()
                .exchangeFunction(stubExchange(patientId))
                .build();

        AtomicReference<CaregiverReportDTO> captured = new AtomicReference<>();
        when(templateEngine.process(eq("report"), any(Context.class))).thenAnswer(inv -> {
            Context ctx = inv.getArgument(1);
            captured.set((CaregiverReportDTO) ctx.getVariable("report"));
            assertEquals("sig", ctx.getVariable("signatureBase64"));
            return minimalHtml();
        });

        CaregiverReportService service = new CaregiverReportService(
                testResultRepository,
                riskScoreRepository,
                templateEngine,
                webClient);

        byte[] pdf = service.generatePatientReportPdf(patientId, "sig");

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);

        CaregiverReportDTO report = captured.get();
        assertNotNull(report);
        assertEquals(patientId, report.getPatientId());
        assertEquals("John Doe", report.getPatientName());
        assertEquals(13, report.getCurrentRiskValue());
        assertEquals("HIGH", report.getRiskLevel());
        assertNotNull(report.getClinicalSummary());
        assertTrue(report.getClinicalSummary().toLowerCase().contains("strong performance"));

        assertNotNull(report.getRecentScores());
        assertEquals(1, report.getRecentScores().size());
        assertEquals("Memory", report.getRecentScores().get(0).getTestName());

        assertNotNull(report.getUnityMetrics());
        assertEquals(1500.0, report.getUnityMetrics().getAvgResponseTime());
        assertEquals(3, report.getUnityMetrics().getSessionsCompleted());
        assertEquals("Highly Responsive", report.getUnityMetrics().getPerformanceTrend());
    }

    @Test
    void generatePatientReportPdf_noResults_producesNoClinicalDataSummary() throws Exception {
        long patientId = 1L;
        when(riskScoreRepository.findTopByPatientIdOrderByGeneratedAtDesc(patientId)).thenReturn(Optional.empty());
        when(testResultRepository.findByPatientId(patientId)).thenReturn(List.of());

        WebClient webClient = WebClient.builder()
                .exchangeFunction(stubExchange(patientId))
                .build();

        AtomicReference<CaregiverReportDTO> captured = new AtomicReference<>();
        when(templateEngine.process(eq("report"), any(Context.class))).thenAnswer(inv -> {
            Context ctx = inv.getArgument(1);
            captured.set((CaregiverReportDTO) ctx.getVariable("report"));
            return minimalHtml();
        });

        CaregiverReportService service = new CaregiverReportService(
                testResultRepository,
                riskScoreRepository,
                templateEngine,
                webClient);

        byte[] pdf = service.generatePatientReportPdf(patientId, null);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);

        CaregiverReportDTO report = captured.get();
        assertNotNull(report);
        assertTrue(report.getClinicalSummary().startsWith("No clinical data has been recorded"));
        assertEquals(0, report.getCurrentRiskValue());
        assertEquals("INITIAL", report.getRiskLevel());
    }

    @Test
    void generatePatientReportPdf_wrapsAnyFailureAsIOException() {
        long patientId = 1L;
        when(riskScoreRepository.findTopByPatientIdOrderByGeneratedAtDesc(patientId)).thenReturn(Optional.empty());
        when(testResultRepository.findByPatientId(patientId)).thenReturn(List.of());

        WebClient webClient = WebClient.builder()
                .exchangeFunction(stubExchange(patientId))
                .build();

        when(templateEngine.process(eq("report"), any(Context.class))).thenThrow(new RuntimeException("boom"));

        CaregiverReportService service = new CaregiverReportService(
                testResultRepository,
                riskScoreRepository,
                templateEngine,
                webClient);

        IOException ex = assertThrows(IOException.class, () -> service.generatePatientReportPdf(patientId, null));
        assertTrue(ex.getMessage().contains("Failed to generate PDF"));
        assertNotNull(ex.getCause());
        assertEquals("boom", ex.getCause().getMessage());
    }

    private static ExchangeFunction stubExchange(long patientId) {
        return request -> {
            URI url = request.url();
            String path = url.getPath();
            if (request.method() == HttpMethod.GET && path.equals("/patient/" + patientId)) {
                return Mono.just(jsonResponse("{\"firstName\":\"John\",\"lastName\":\"Doe\"}"));
            }
            if (request.method() == HttpMethod.GET && path.equals("/game-metrics/patient/" + patientId)) {
                return Mono.just(jsonResponse(
                        "{\"patientId\":\"" + patientId
                                + "\",\"currentStreak\":0,\"longestStreak\":0,\"totalGamesPlayed\":3,\"averageResponseTime\":1500.0}"));
            }
            return Mono.error(new IllegalStateException("Unexpected request: " + request.method() + " " + url));
        };
    }

    private static ClientResponse jsonResponse(String json) {
        DefaultDataBufferFactory factory = new DefaultDataBufferFactory();
        DataBuffer buffer = factory.wrap(json.getBytes(StandardCharsets.UTF_8));

        return ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(Flux.just(buffer))
                .build();
    }

    private static String minimalHtml() {
        return "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head><meta charset=\"UTF-8\" /></head><body>Hi</body></html>";
    }
}
