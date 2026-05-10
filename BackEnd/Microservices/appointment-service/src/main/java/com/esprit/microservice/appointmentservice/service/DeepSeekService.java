package com.esprit.microservice.appointmentservice.service;

import com.esprit.microservice.appointmentservice.dto.ai.FreeSlotsRequest;
import com.esprit.microservice.appointmentservice.dto.ai.MonthlyFreeSlotsResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeepSeekService {

    private static final Logger log = LoggerFactory.getLogger(DeepSeekService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${deepseek.api.base-url:https://api.deepseek.com/chat/completions}")
    private String deepSeekBaseUrl;

    @Value("${deepseek.api.model:deepseek-chat}")
    private String deepSeekModel;

    @Value("${deepseek.api.key:}")
    private String deepSeekApiKey;

    public DeepSeekService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public MonthlyFreeSlotsResponse generateFreeSlots(
            String month,
            List<FreeSlotsRequest.DoctorInfo> doctors,
            String bookedJson
    ) {
        String doctorsJson;
        try {
            doctorsJson = objectMapper.writeValueAsString(doctors);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize doctors list", e);
        }

        String prompt = buildPrompt(month, doctorsJson, bookedJson);
        String rawResponse = callDeepSeek(prompt);
        return parseResponse(rawResponse);
    }

    private String buildPrompt(String month, String doctorsJson, String bookedJson) {
        return """
You are an AI assistant that generates available appointment slots for doctors.

INPUT DATA
- Current month: %s (format YYYY-MM)
- Today's date: %s
- Doctors list: %s
- Already booked appointments this month: %s
  (each entry has doctorName, date YYYY-MM-DD, time HHMM — e.g. "0900" means 09:00)

WORKING HOURS
- Days: Monday to Friday only (exclude Saturday and Sunday)
- Morning shift: 0900 to 1200
- Afternoon shift: 1400 to 1700
- Slot duration: 60 minutes (valid slots: 0900, 1000, 1100, 1400, 1500, 1600)

TASK
For EACH doctor in the list, find the first 5 free slots for the current month.
A slot is TAKEN if there is an entry in the booked list where doctorName matches exactly AND date matches AND time matches.
A slot is FREE only if it is NOT taken.
Only include slots strictly after today's date.
You MUST return at least the first 5 free slots per doctor (do not return empty arrays unless the doctor genuinely has zero free slots this month).

CRITICAL OUTPUT RULES
1. Return ONLY raw JSON — no markdown, no ```json fences, no explanations.
2. Use this EXACT JSON structure:
{"month":"%s","doctors":[{"name":"Doctor Full Name","specialty":"Specialty","freeSlots":[{"date":"2026-05-12","times":["0900","1000","1100","1400","1500"]},{"date":"2026-05-13","times":["0900","1000"]}]}]}

IMPORTANT
- Never return an empty doctors array if doctors exist in input.
- Never return empty freeSlots unless ALL slots this month are booked for that doctor.
- Dates must be strictly in the future (after today's date).
- Generate slots spread across the whole month, not just the next week.
""".formatted(month, LocalDate.now(), doctorsJson, bookedJson, month);
    }

    private String callDeepSeek(String userPrompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(deepSeekApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", deepSeekModel);
        body.put("messages", List.of(Map.of("role", "user", "content", userPrompt)));
        body.put("temperature", 0.1);
        body.put("max_tokens", 4096);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            String raw = restTemplate.postForObject(deepSeekBaseUrl, entity, String.class);
            JsonNode root = objectMapper.readTree(raw);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            log.error("DeepSeek API call failed: {}", e.getMessage());
            throw new RuntimeException("DeepSeek API call failed: " + e.getMessage(), e);
        }
    }

    private MonthlyFreeSlotsResponse parseResponse(String content) {
        String cleaned = content.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();

        try {
            return objectMapper.readValue(cleaned, MonthlyFreeSlotsResponse.class);
        } catch (Exception e) {
            log.error("Failed to parse DeepSeek response: {}", content);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
        }
    }
}
