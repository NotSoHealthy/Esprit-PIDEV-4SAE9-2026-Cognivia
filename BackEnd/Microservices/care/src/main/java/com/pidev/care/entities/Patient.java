package com.pidev.care.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Patient {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    @Column(unique = true)
    private UUID userId;
    private String firstName;
    private String lastName;
    @Enumerated(EnumType.STRING)
    private Gender gender;
    private LocalDate dateOfBirth;
    private int checkInFrequency; // in minutes
    @Enumerated(EnumType.STRING)
    private Severity severity;
    
    @JsonIgnore
    @ManyToMany
    private List<EmergencyContact> emergencyContactList;

    @JsonIgnore
    @ManyToMany(mappedBy = "patientList")
    private List<Caregiver> caregiverList;


    @JsonIgnore
    @OneToMany(mappedBy = "patient")
    private List<Visit> visits;


    @JsonIgnore
    @OneToMany(mappedBy = "patient")
    private List<Note> notes;
}
