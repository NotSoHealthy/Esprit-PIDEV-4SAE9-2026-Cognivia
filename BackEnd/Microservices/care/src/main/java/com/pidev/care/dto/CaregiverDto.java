package com.pidev.care.dto;

import com.pidev.care.entities.Caregiver;
import com.pidev.care.entities.Patient;
import com.pidev.care.entities.Visit;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CaregiverDto {
    private Long id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String type;
    private List<Long> patientIdList;
    private List<Long> visitIdList;

    public static CaregiverDto fromCaregiver(Caregiver caregiver) {
        CaregiverDto dto = new CaregiverDto();
        dto.setId(caregiver.getId());
        dto.setUserId(caregiver.getUserId());
        dto.setFirstName(caregiver.getFirstName());
        dto.setLastName(caregiver.getLastName());

        if (caregiver.getType() != null) {
            dto.setType(caregiver.getType().toString());
        }

        if (caregiver.getPatientList() != null) {
            dto.setPatientIdList(
                    caregiver.getPatientList().stream()
                            .map(Patient::getId)
                            .toList()
            );
        }

        if (caregiver.getVisitList() != null) {
            dto.setVisitIdList(
                    caregiver.getVisitList().stream()
                            .map(Visit::getId)
                            .toList()
            );
        }

        return dto;
    }
}
