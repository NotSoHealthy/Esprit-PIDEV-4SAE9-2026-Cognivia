package com.pidev.care.keycloak;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

@Component
public class KeycloakAdminClient {

    private final WebClient webClient;

    private final String baseUrl;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    // tiny in-memory cache so you don't request a token for every call
    private volatile String cachedAccessToken;
    private volatile Instant cachedAccessTokenExpiresAt;

    public KeycloakAdminClient(
            WebClient.Builder webClientBuilder,
            @Value("${keycloak.base-url}") String baseUrl,
            @Value("${keycloak.realm}") String realm,
            @Value("${keycloak.client-id}") String clientId,
            @Value("${keycloak.client-secret}") String clientSecret) {

        this.baseUrl = baseUrl;
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;

        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .build();
    }

    public Mono<KeycloakUser> getUserById(String userId) {
        return getAccessToken()
                .flatMap(token -> webClient.get()
                        .uri("/admin/realms/{realm}/users/{id}", realm, userId)
                        .headers(h -> h.setBearerAuth(token))
                        .retrieve()
                        .bodyToMono(KeycloakUser.class));
    }

    public Mono<List<KeycloakUser>> searchByUsername(String username, boolean exact) {
        return getAccessToken()
                .flatMap(token -> webClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/admin/realms/{realm}/users")
                                .queryParam("username", username)
                                .queryParam("exact", exact)
                                .build(realm))
                        .headers(h -> h.setBearerAuth(token))
                        .retrieve()
                        .bodyToFlux(KeycloakUser.class)
                        .collectList());
    }

    private Mono<String> getAccessToken() {
        // if token still valid for 30 seconds, reuse
        Instant now = Instant.now();
        if (cachedAccessToken != null && cachedAccessTokenExpiresAt != null
                && cachedAccessTokenExpiresAt.isAfter(now.plusSeconds(30))) {
            return Mono.just(cachedAccessToken);
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);

        return webClient.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", realm)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form)
                .retrieve()
                .bodyToMono(TokenResponse.class)
                .map(tr -> {
                    cachedAccessToken = tr.access_token();
                    cachedAccessTokenExpiresAt = Instant.now().plusSeconds(tr.expires_in());
                    return cachedAccessToken;
                });
    }

    public record TokenResponse(String access_token, long expires_in) {}

    public record KeycloakUser(
            String id,
            String email,
            Map<String, List<String>> attributes
    ) {
        public String phoneNumber() {
            if (attributes == null) return null;
            List<String> values = attributes.get("phone_number"); // or "phone"
            return (values == null || values.isEmpty()) ? null : values.get(0);
        }
    }
}