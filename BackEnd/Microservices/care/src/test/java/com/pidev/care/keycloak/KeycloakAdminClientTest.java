package com.pidev.care.keycloak;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

class KeycloakAdminClientTest {

    @Test
    void getUserById_reusesCachedAccessToken() {
        AtomicInteger tokenCalls = new AtomicInteger();
        AtomicInteger userCalls = new AtomicInteger();

        ExchangeFunction exchangeFunction = request -> {
            URI url = request.url();
            String path = url.getPath();

            if (request.method() == HttpMethod.POST && path.equals("/realms/test/protocol/openid-connect/token")) {
                tokenCalls.incrementAndGet();
                return Mono.just(jsonResponse("{\"access_token\":\"t\",\"expires_in\":3600}"));
            }

            if (request.method() == HttpMethod.GET && path.startsWith("/admin/realms/test/users/")) {
                userCalls.incrementAndGet();
                assertThat(request.headers().getFirst(HttpHeaders.AUTHORIZATION)).isEqualTo("Bearer t");
                String userId = path.substring(path.lastIndexOf('/') + 1);
                return Mono.just(jsonResponse(
                        "{\"id\":\"" + userId
                                + "\",\"email\":\"u@x.com\",\"attributes\":{\"phone_number\":[\"+1\"]}}"));
            }

            return Mono.error(new IllegalStateException("Unexpected request: " + request.method() + " " + url));
        };

        WebClient.Builder builder = WebClient.builder().exchangeFunction(exchangeFunction);
        KeycloakAdminClient client = new KeycloakAdminClient(builder, "http://keycloak", "test", "cid", "secret");

        KeycloakAdminClient.KeycloakUser u1 = client.getUserById("123").block();
        KeycloakAdminClient.KeycloakUser u2 = client.getUserById("456").block();

        assertThat(u1).isNotNull();
        assertThat(u1.id()).isEqualTo("123");
        assertThat(u2).isNotNull();
        assertThat(u2.id()).isEqualTo("456");
        assertThat(tokenCalls.get()).isEqualTo(1);
        assertThat(userCalls.get()).isEqualTo(2);
    }

    @Test
    void searchByUsername_callsUsersEndpointWithQueryParams() {
        AtomicInteger tokenCalls = new AtomicInteger();
        AtomicInteger searchCalls = new AtomicInteger();

        ExchangeFunction exchangeFunction = request -> {
            URI url = request.url();
            String path = url.getPath();

            if (request.method() == HttpMethod.POST && path.equals("/realms/test/protocol/openid-connect/token")) {
                tokenCalls.incrementAndGet();
                return Mono.just(jsonResponse("{\"access_token\":\"t\",\"expires_in\":3600}"));
            }

            if (request.method() == HttpMethod.GET && path.equals("/admin/realms/test/users")) {
                searchCalls.incrementAndGet();
                assertThat(request.headers().getFirst(HttpHeaders.AUTHORIZATION)).isEqualTo("Bearer t");
                assertThat(url.getQuery()).contains("username=john");
                assertThat(url.getQuery()).contains("exact=true");
                return Mono.just(jsonResponse(
                        "[{\"id\":\"1\",\"email\":\"a@b.com\",\"attributes\":null},{\"id\":\"2\",\"email\":\"c@d.com\",\"attributes\":{}}]"));
            }

            return Mono.error(new IllegalStateException("Unexpected request: " + request.method() + " " + url));
        };

        WebClient.Builder builder = WebClient.builder().exchangeFunction(exchangeFunction);
        KeycloakAdminClient client = new KeycloakAdminClient(builder, "http://keycloak", "test", "cid", "secret");

        List<KeycloakAdminClient.KeycloakUser> users = client.searchByUsername("john", true).block();
        assertThat(users).isNotNull();
        assertThat(users).hasSize(2);
        assertThat(users.get(0).id()).isEqualTo("1");
        assertThat(users.get(1).id()).isEqualTo("2");
        assertThat(tokenCalls.get()).isEqualTo(1);
        assertThat(searchCalls.get()).isEqualTo(1);
    }

    @Test
    void keycloakUser_phoneNumber_handlesNullAndEmpty() {
        KeycloakAdminClient.KeycloakUser noAttrs = new KeycloakAdminClient.KeycloakUser("1", "a@b.com", null);
        assertThat(noAttrs.phoneNumber()).isNull();

        KeycloakAdminClient.KeycloakUser empty = new KeycloakAdminClient.KeycloakUser(
                "2", "b@c.com", Map.of("phone_number", List.of()));
        assertThat(empty.phoneNumber()).isNull();

        KeycloakAdminClient.KeycloakUser ok = new KeycloakAdminClient.KeycloakUser(
                "3", "c@d.com", Map.of("phone_number", List.of("+216123")));
        assertThat(ok.phoneNumber()).isEqualTo("+216123");
    }

    private static ClientResponse jsonResponse(String json) {
        DefaultDataBufferFactory factory = new DefaultDataBufferFactory();
        DataBuffer buffer = factory.wrap(json.getBytes(StandardCharsets.UTF_8));

        return ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(Flux.just(buffer))
                .build();
    }
}
