package com.pidev.pharmacy.rabbitMQ;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.Map;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GenericEvent {
    private String eventType;
    private Map<String, Object> payload;
    private Instant occurredAt = Instant.now();
}
