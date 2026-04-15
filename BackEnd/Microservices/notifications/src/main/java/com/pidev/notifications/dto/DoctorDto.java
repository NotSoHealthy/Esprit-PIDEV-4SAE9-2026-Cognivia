package com.pidev.notifications.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class DoctorDto {
    private Long id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String specialty;
    private String licenseNumber;
    private List<Long> noteIdList;
    private List<Long> patientDoctorAssignmentIdList;
}
