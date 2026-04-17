package com.pidev.care.controllers;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTest {

    @Test
    void handleAllExceptions_returns500WithDetails() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        RuntimeException ex = new RuntimeException("boom");

        ResponseEntity<Map<String, String>> response = handler.handleAllExceptions(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).containsKeys("error", "message", "trace");
        assertThat(response.getBody().get("error")).isEqualTo("RuntimeException");
        assertThat(response.getBody().get("message")).isEqualTo("boom");
        assertThat(response.getBody().get("trace")).contains("RuntimeException");
    }
}
