package com.pidev.notifications.dto;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class VisitDto {
    private Long id;
    private String status;
    private LocalDate date;
    private Instant createdAt;
    private Long caregiverId;
    private Long patientId;
    private Long doctorId;
}
