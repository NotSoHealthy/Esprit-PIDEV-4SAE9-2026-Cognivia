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

    @Value("${deepseek.ai.api.key}")
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
            return callDeepSeek(prompt, effectiveKey);
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

    private String callDeepSeek(String prompt, String effectiveKey) {
        String url = "https://api.deepseek.com/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(effectiveKey);

        Map<String, Object> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", "You are a helpful assistant that summarizes forum posts and comments concisely.");

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
                log.warn("DeepSeek response missing expected structure: {}", body);
            } else {
                log.error("DeepSeek API returned error: {} - {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Exception while calling DeepSeek API", e);
            throw new RuntimeException("AI API failure", e);
        }
        throw new RuntimeException("Could not extract summary from DeepSeek response");
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
