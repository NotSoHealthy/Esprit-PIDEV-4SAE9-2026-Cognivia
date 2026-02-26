package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.repositories.TestResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DataExportService {

    private final TestResultRepository testResultRepository;
    private final RestTemplate restTemplate;

    private static final String CARE_SERVICE_URL = "http://localhost:8081";

    public DataExportService(TestResultRepository testResultRepository) {
        this.testResultRepository = testResultRepository;
        this.restTemplate = new RestTemplate();
    }

    public String exportMLDataAsCsv() {
        List<TestResult> results = testResultRepository.findAll();

        StringBuilder csv = new StringBuilder();
        // CSV Header
        csv.append("patient_id,patient_name,age,gender,initial_severity,test_title,score,response_time_ms,taken_at\n");

        for (TestResult result : results) {
            Map<String, Object> patient = fetchPatientData(result.getPatientId());

            String patientName = "unknown";
            String age = "unknown";
            String gender = "unknown";
            String severity = "unknown";

            if (patient != null) {
                String first = patient.get("firstName") != null ? patient.get("firstName").toString() : "";
                String last = patient.get("lastName") != null ? patient.get("lastName").toString() : "";
                patientName = (first + " " + last).trim();
                if (patientName.isEmpty())
                    patientName = "unknown";

                if (patient.get("dateOfBirth") != null) {
                    try {
                        LocalDate dob = LocalDate.parse(patient.get("dateOfBirth").toString());
                        age = String.valueOf(Period.between(dob, LocalDate.now()).getYears());
                    } catch (Exception e) {
                        age = "unknown";
                    }
                }
                gender = patient.get("gender") != null ? patient.get("gender").toString() : "unknown";
                severity = patient.get("severity") != null ? patient.get("severity").toString() : "unknown";
            }

            csv.append(result.getPatientId()).append(",")
                    .append(escapeCsvField(patientName)).append(",")
                    .append(age).append(",")
                    .append(gender).append(",")
                    .append(severity).append(",")
                    .append(escapeCsvField(result.getTest().getTitle())).append(",")
                    .append(result.getScore()).append(",")
                    .append(result.getResponseTime()).append(",")
                    .append(result.getTakenAt()).append("\n");
        }

        return csv.toString();
    }

    private Map<String, Object> fetchPatientData(Long patientId) {
        try {
            return restTemplate.getForObject(CARE_SERVICE_URL + "/patient/" + patientId, Map.class);
        } catch (Exception e) {
            System.err.println("Failed to fetch patient data for ML export: " + e.getMessage());
            return null;
        }
    }

    private String escapeCsvField(String field) {
        if (field == null)
            return "";
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }
}
