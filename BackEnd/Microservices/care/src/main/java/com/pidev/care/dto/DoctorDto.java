package com.pidev.care.dto;

import com.pidev.care.entities.Doctor;
import com.pidev.care.entities.Note;
import com.pidev.care.entities.PatientDoctorAssignment;
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
public class DoctorDto {
    private Long id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String specialty;
    private String licenseNumber;
    private List<Long> noteIdList;
    private List<Long> patientDoctorAssignmentIdList;

    public static DoctorDto fromDoctor(Doctor doctor) {
        DoctorDto dto = new DoctorDto();
        dto.setId(doctor.getId());
        dto.setUserId(doctor.getUserId());
        dto.setFirstName(doctor.getFirstName());
        dto.setLastName(doctor.getLastName());
        dto.setSpecialty(doctor.getSpecialty());
        dto.setLicenseNumber(doctor.getLicenseNumber());

        if (doctor.getNotes() != null) {
            dto.setNoteIdList(
                    doctor.getNotes().stream()
                            .map(Note::getId)
                            .toList()
            );
        }

        if (doctor.getPatientDoctorAssignments() != null) {
            dto.setPatientDoctorAssignmentIdList(
                    doctor.getPatientDoctorAssignments().stream()
                            .map(PatientDoctorAssignment::getId)
                            .toList()
            );
        }

        return dto;
    }
}
