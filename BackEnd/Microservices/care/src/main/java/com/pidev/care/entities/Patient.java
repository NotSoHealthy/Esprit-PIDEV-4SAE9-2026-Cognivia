package com.pidev.care.entities;

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
    private UUID userId;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private int checkInFrequency; // in minutes
    private Severity severity;
    @ManyToMany
    private List<EmergencyContact> emergencyContactList;
    @ManyToMany(mappedBy = "patientList")
    private List<CareGiver> careGiverList;
    @OneToMany(mappedBy = "patient")
    private List<Visit> visits;
    @OneToMany(mappedBy = "patient")
    private List<Note> notes;
}
