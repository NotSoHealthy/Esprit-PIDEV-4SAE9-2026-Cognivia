package com.pidev.notifications.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class PatientDto {
    private Long id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String gender;
    private LocalDate dateOfBirth;
    private Integer checkInFrequency;
    private String severity;
    private List<Long> emergencyContactIdList;
    private List<Long> caregiverIdList;
}
