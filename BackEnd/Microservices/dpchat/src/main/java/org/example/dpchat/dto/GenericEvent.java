package org.example.dpchat.dto;

import lombok.*;

import java.util.Map;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class GenericEvent {
    private String eventType;
    private Map<String, Object> payload;
}
