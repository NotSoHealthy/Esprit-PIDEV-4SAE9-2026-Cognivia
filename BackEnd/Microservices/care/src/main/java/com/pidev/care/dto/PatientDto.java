package com.pidev.care.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pidev.care.entities.*;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
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

    public record PatientContactInfoDto(String email, String phoneNumber) {}

    public static PatientDto fromPatient(Patient patient) {
        PatientDto dto = new PatientDto();
        dto.setId(patient.getId());
        dto.setUserId(patient.getUserId());
        dto.setFirstName(patient.getFirstName());
        dto.setLastName(patient.getLastName());
        dto.setGender(patient.getGender().toString());
        dto.setDateOfBirth(patient.getDateOfBirth());
        dto.setCheckInFrequency(patient.getCheckInFrequency());
        dto.setSeverity(patient.getSeverity().toString());
        if (patient.getEmergencyContactList() != null) {
            dto.setEmergencyContactIdList(
                    patient.getEmergencyContactList().stream()
                            .map(EmergencyContact::getId)
                            .toList()
            );
        }
        if (patient.getCaregiverList() != null) {
            dto.setCaregiverIdList(
                    patient.getCaregiverList().stream()
                            .map(Caregiver::getId)
                            .toList()
            );
        }
        return dto;
    }
}
