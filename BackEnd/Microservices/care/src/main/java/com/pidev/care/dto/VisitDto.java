package com.pidev.care.dto;

import com.pidev.care.entities.Visit;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class VisitDto {
    private Long id;
    private String status;
    private LocalDate date;
    private Instant createdAt;
    private Long caregiverId;
    private Long patientId;
    private Long doctorId;

    public static VisitDto fromVisit(Visit visit) {
        VisitDto dto = new VisitDto();
        dto.setId(visit.getId());
        dto.setStatus(visit.getStatus().toString());
        dto.setDate(visit.getDate());
        dto.setCreatedAt(visit.getCreatedAt());
        dto.setCaregiverId(visit.getCaregiver() != null ? visit.getCaregiver().getId() : null);
        dto.setPatientId(visit.getPatient() != null ? visit.getPatient().getId() : null);
        dto.setDoctorId(visit.getDoctor() != null ? visit.getDoctor().getId() : null);
        return dto;
    }
}
