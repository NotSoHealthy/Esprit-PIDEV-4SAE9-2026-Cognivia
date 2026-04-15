package com.pidev.monitoring.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.services.DataExportService;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class DataExportControllerTest {

    @Mock
    private DataExportService service;

    private DataExportController controller;

    @BeforeEach
    void setUp() {
        controller = new DataExportController(service);
    }

    @Test
    void exportMLData_buildsCsvAttachmentResponse() {
        when(service.exportMLDataAsCsv()).thenReturn("a,b\n1,2\n");

        ResponseEntity<byte[]> resp = controller.exportMLData();

        assertEquals(200, resp.getStatusCode().value());
        assertNotNull(resp.getBody());
        assertEquals("a,b\n1,2\n", new String(resp.getBody(), StandardCharsets.UTF_8));

        String cd = resp.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION);
        assertNotNull(cd);
        assertTrue(cd.startsWith("attachment; filename=patient_ml_data_"));
        assertTrue(cd.endsWith(".csv"));
        assertEquals("text/csv", resp.getHeaders().getContentType().toString());
    }
}
