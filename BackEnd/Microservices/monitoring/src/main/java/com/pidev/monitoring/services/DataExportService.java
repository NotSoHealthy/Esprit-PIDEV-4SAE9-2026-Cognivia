package com.pidev.monitoring.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.monitoring.entities.TestResult;
import com.pidev.monitoring.openfeign.CareClient;
import com.pidev.monitoring.repositories.TestResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataExportService {

    private final TestResultRepository testResultRepository;
    private final CareClient careClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String exportMLDataAsCsv() {
        List<TestResult> results = testResultRepository.findAll();

        StringBuilder csv = new StringBuilder();
        // CSV Header
        csv.append("patient_id,patient_name,age,gender,initial_severity,test_title,score,response_time_ms,taken_at\n");

        for (TestResult result : results) {
            String patientName = "unknown";
            String age         = "unknown";
            String gender      = "unknown";
            String severity    = "unknown";

            try {
                String raw = careClient.getPatientById(result.getPatientId());
                if (raw != null && !raw.isBlank()) {
                    JsonNode node = objectMapper.readTree(raw);

                    String firstName = extractSafe(node, "firstName");
                    String lastName  = extractSafe(node, "lastName");
                    String fullName  = (firstName + " " + (lastName != null ? lastName : "")).trim();
                    if (!fullName.isBlank()) patientName = fullName;

                    String dob = extractSafe(node, "dateOfBirth");
                    if (dob != null) {
                        try {
                            age = String.valueOf(Period.between(LocalDate.parse(dob), LocalDate.now()).getYears());
                        } catch (Exception ex) {
                            log.warn("Could not parse dateOfBirth '{}' for patient {}", dob, result.getPatientId());
                        }
                    }

                    String g = extractSafe(node, "gender");
                    if (g != null) gender = g;

                    String s = extractSafe(node, "severity");
                    if (s != null) severity = s;
                }
            } catch (Exception e) {
                log.warn("Failed to fetch patient data for ML export (patientId={}): {}",
                        result.getPatientId(), e.getMessage());
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

    /**
     * Safely extracts a text value from a JsonNode by key.
     * Returns null if the key is absent, null, or blank.
     */
    private String extractSafe(JsonNode node, String key) {
        if (node == null || node.isMissingNode()) return null;
        JsonNode v = node.get(key);
        if (v == null || v.isNull()) return null;
        String text = v.asText().trim();
        return text.isEmpty() ? null : text;
    }

    private String escapeCsvField(String field) {
        if (field == null) return "";
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }
}
