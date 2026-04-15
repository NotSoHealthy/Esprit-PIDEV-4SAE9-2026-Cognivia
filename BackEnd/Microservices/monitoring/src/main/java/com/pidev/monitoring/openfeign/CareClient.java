package com.pidev.monitoring.openfeign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for the 'care' microservice.
 * Returns raw JSON strings to avoid HttpMessageConverter deserialization failures.
 * Service discovery is handled automatically by Eureka via name = "care".
 */
@FeignClient(name = "care")
public interface CareClient {

    @GetMapping("/patient/{id}")
    String getPatientById(@PathVariable("id") Long id);
}
