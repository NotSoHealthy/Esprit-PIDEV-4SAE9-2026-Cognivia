package com.pidev.care.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Doctor {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String specialization;
    private String licenseNumber;
    @OneToMany
    private List<Visit> visits;
    @OneToMany
    private List<Note> notes;
    @OneToMany(mappedBy = "doctor")
    private List<PatientDoctorAssignment> patientDoctorAssignments;
}
