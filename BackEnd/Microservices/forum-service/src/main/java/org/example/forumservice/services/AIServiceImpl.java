package org.example.forumservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.forumservice.entities.Comment;
import org.example.forumservice.entities.Post;
import org.example.forumservice.repositories.CommentRepository;
import org.example.forumservice.repositories.PostRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceImpl implements AIService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${google.ai.api.key}")
    private String apiKey;

    private String normalizedApiKey() {
        if (apiKey == null)
            return "";
        String key = apiKey.trim();
        if (key.length() >= 2
                && ((key.startsWith("\"") && key.endsWith("\"")) || (key.startsWith("'") && key.endsWith("'")))) {
            key = key.substring(1, key.length() - 1).trim();
        }
        return key;
    }

    @Override
    public String summarizePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        List<Comment> comments = commentRepository.findByPostId(postId);

        String prompt = buildPrompt(post, comments);

        final String effectiveKey = normalizedApiKey();
        if (effectiveKey.isBlank()) {
            log.warn("AI API Key missing. Returning fallback summary.");
            return generateFallbackSummary(post, comments);
        }

        try {
            return callAIModule(prompt, effectiveKey);
        } catch (Exception e) {
            log.error("Error calling AI API", e);
            return "Unable to generate AI summary at this moment. " + generateFallbackSummary(post, comments);
        }
    }

    private String buildPrompt(Post post, List<Comment> comments) {
        StringBuilder sb = new StringBuilder();
        sb.append("Summarize the following forum post and its ").append(comments.size()).append(" comments.\n");
        sb.append("Post Title: ").append(post.getTitle()).append("\n");
        sb.append("Post Content: ").append(post.getContent()).append("\n");

        if (!comments.isEmpty()) {
            sb.append("Comments:\n");
            for (Comment c : comments) {
                sb.append("- ").append(c.getContent()).append("\n");
            }
        }

        sb.append(
                "\nProvide a concise 2-3 sentence summary of the main points and the general consensus of the discussion.");
        return sb.toString();
    }

    private String callAIModule(String prompt, String effectiveKey) {
        String url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key="
                + effectiveKey;
        System.out.println(effectiveKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Use Map for robust JSON serialization
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(content));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            // Use Map for robust JSON deserialization
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();

                // Navigate Gemini response structure: candidates[0].content.parts[0].text
                List candidates = (List) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map firstCandidate = (Map) candidates.get(0);
                    Map resContent = (Map) firstCandidate.get("content");
                    if (resContent != null) {
                        List parts = (List) resContent.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map firstPart = (Map) parts.get(0);
                            String text = (String) firstPart.get("text");
                            if (text != null) {
                                return text.trim();
                            }
                        }
                    }
                }
                log.warn("Gemini response missing expected content structure: {}", body);
            } else {
                log.error("Gemini API returned error status: {} - {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Exception while calling Gemini API", e);
            throw new RuntimeException("AI API failure", e);
        }
        throw new RuntimeException("Could not extract summary from Gemini response");
    }

    private String generateFallbackSummary(Post post, List<Comment> comments) {
        StringBuilder sb = new StringBuilder();
        sb.append("Heuristic Summary: This post about '").append(post.getTitle()).append("' ");
        if (comments.isEmpty()) {
            sb.append("has no discussion yet.");
        } else {
            sb.append("has focused on ").append(comments.size())
                    .append(" responses discussing various aspects of the topic.");
        }
        return sb.toString();
    }
}
