package com.pidev.care.events;

import lombok.*;

import java.util.Map;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GenericEvent {
    private String eventType;
    private Map<String, Object> payload;
}
