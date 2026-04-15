package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.services.CaregiverReportService;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    @Mock
    private CaregiverReportService service;

    private ReportController controller;

    @BeforeEach
    void setUp() {
        controller = new ReportController(service);
    }

    @Test
    void generateReport_returnsPdfResponse() throws Exception {
        byte[] pdf = new byte[] { 1, 2, 3 };
        when(service.generatePatientReportPdf(5L, "sig")).thenReturn(pdf);

        ResponseEntity<byte[]> resp = controller.generateReport(5L, Map.of("signature", "sig"));

        assertEquals(200, resp.getStatusCode().value());
        assertArrayEquals(pdf, resp.getBody());
        assertEquals("application/pdf", resp.getHeaders().getContentType().toString());
        assertNotNull(resp.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
    }

    @Test
    void generateReport_whenServiceThrows_returns500() throws Exception {
        when(service.generatePatientReportPdf(5L, null)).thenThrow(new RuntimeException("boom"));

        ResponseEntity<byte[]> resp = controller.generateReport(5L, Map.of());

        assertEquals(500, resp.getStatusCode().value());
    }
}
