package com.pidev.notifications.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.time.Instant;
import java.util.Map;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
public class GenericEvent {
    private String eventType;
    private Map<String, Object> payload;
    private Instant occurredAt = Instant.now();
}
