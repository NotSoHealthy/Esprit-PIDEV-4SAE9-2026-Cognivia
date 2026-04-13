package org.example.dpchat.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceImpl implements AIService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${google.ai.api.key}")
    private String apiKey;

    private String normalizedApiKey() {
        if (apiKey == null) return "";
        String key = apiKey.trim();
        if (key.length() >= 2 && ((key.startsWith("\"") && key.endsWith("\"")) || (key.startsWith("'") && key.endsWith("'")))) {
            key = key.substring(1, key.length() - 1).trim();
        }
        return key;
    }

    @Override
    public String generateSummary(String messagesText) {
        String effectiveKey = normalizedApiKey();
        if (effectiveKey.isBlank()) {
            log.warn("AI API Key missing. Returning fallback.");
            return "Unable to generate AI summary because the API key is missing.";
        }

        String prompt = "Summarize the following chat messages to help the user catch up with the conversation. " +
                "Provide a concise summary in 2-3 sentences max.\n\n" + messagesText;

        try {
            return callGemini(prompt, effectiveKey);
        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            return "Unable to generate summary at this time.";
        }
    }

    private String callGemini(String prompt, String effectiveKey) {
        String url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + effectiveKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(content));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List candidates = (List) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map firstCandidate = (Map) candidates.get(0);
                    Map resContent = (Map) firstCandidate.get("content");
                    if (resContent != null) {
                        List parts = (List) resContent.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map firstPart = (Map) parts.get(0);
                            return ((String) firstPart.get("text")).trim();
                        }
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("AI API failure", e);
        }
        return "Could not generate summary.";
    }
}
