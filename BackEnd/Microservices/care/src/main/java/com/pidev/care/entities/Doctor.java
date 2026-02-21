package com.pidev.care.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @Column(unique = true)
    private UUID userId;
    private String firstName;
    private String lastName;
    private String specialty;
    private String licenseNumber;
    @OneToMany
    @JsonIgnore
    private List<Note> notes;
    @OneToMany(mappedBy = "doctor")
    @JsonIgnore
    private List<PatientDoctorAssignment> patientDoctorAssignments;
}
