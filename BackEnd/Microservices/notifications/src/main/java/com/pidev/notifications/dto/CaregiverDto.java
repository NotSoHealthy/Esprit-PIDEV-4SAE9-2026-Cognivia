package com.pidev.notifications.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class CaregiverDto {
    private Long id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String type;
    private List<Long> patientIdList;
    private List<Long> visitIdList;
}
