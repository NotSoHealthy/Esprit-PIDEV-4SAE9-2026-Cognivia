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

    @Value("${deepseek.ai.api.key}")
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
            return callDeepSeek(prompt, effectiveKey);
        } catch (Exception e) {
            log.error("Error calling DeepSeek API", e);
            return "Unable to generate summary at this time.";
        }
    }

    private String callDeepSeek(String prompt, String effectiveKey) {
        String url = "https://api.deepseek.com/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(effectiveKey);

        Map<String, Object> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", "You are a helpful assistant that summarizes chat messages concisely.");

        Map<String, Object> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "deepseek-chat");
        requestBody.put("messages", List.of(systemMessage, userMessage));
        requestBody.put("stream", false);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List choices = (List) body.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map firstChoice = (Map) choices.get(0);
                    Map message = (Map) firstChoice.get("message");
                    if (message != null) {
                        return ((String) message.get("content")).trim();
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("AI API failure", e);
        }
        return "Could not generate summary.";
    }
}
