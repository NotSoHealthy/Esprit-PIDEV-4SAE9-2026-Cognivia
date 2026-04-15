package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.CognitiveTest;
import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.openfeign.CareClient;
import com.pidev.monitoring.repositories.TestResultRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataExportServiceTest {

    @Mock
    private TestResultRepository testResultRepository;

    @Mock
    private CareClient careClient;

    @Test
    void exportMLDataAsCsv_includesPatientDataAndEscapesCommas() {
        CognitiveTest test = new CognitiveTest();
        test.setTitle("Memory, Test");

        TestResult result = new TestResult();
        result.setPatientId(1L);
        result.setTest(test);
        result.setScore(88.0);
        result.setResponseTime(123L);
        result.setTakenAt(LocalDateTime.of(2026, 1, 1, 12, 0));

        when(testResultRepository.findAll()).thenReturn(List.of(result));

        LocalDate dob = LocalDate.now().minusYears(20);
        String patientJson = """
                {
                  "firstName": "John",
                  "lastName":  "Doe",
                  "dateOfBirth": "%s",
                  "gender": "MALE",
                  "severity": "LOW"
                }
                """.formatted(dob);
        when(careClient.getPatientById(1L)).thenReturn(patientJson);

        DataExportService service = new DataExportService(testResultRepository, careClient);

        String csv = service.exportMLDataAsCsv();

        assertTrue(csv.startsWith(
                "patient_id,patient_name,age,gender,initial_severity,test_title,score,response_time_ms,taken_at\n"));
        assertTrue(csv.contains("1,John Doe,20,MALE,LOW,\"Memory, Test\",88.0,123,"));
        assertTrue(csv.contains("2026-01-01T12:00"));
    }

    @Test
    void exportMLDataAsCsv_usesUnknownWhenPatientFetchFails() {
        CognitiveTest test = new CognitiveTest();
        test.setTitle("Simple Test");

        TestResult result = new TestResult();
        result.setPatientId(2L);
        result.setTest(test);
        result.setScore(10.0);
        result.setResponseTime(5L);
        result.setTakenAt(LocalDateTime.of(2026, 1, 1, 12, 0));

        when(testResultRepository.findAll()).thenReturn(List.of(result));
        when(careClient.getPatientById(2L)).thenThrow(new RuntimeException("care-service down"));

        DataExportService service = new DataExportService(testResultRepository, careClient);

        String csv = service.exportMLDataAsCsv();

        assertTrue(csv.contains("2,unknown,unknown,unknown,unknown,Simple Test,10.0,5,"));
    }
}

