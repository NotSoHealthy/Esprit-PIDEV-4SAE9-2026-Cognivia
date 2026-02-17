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
public class Caregiver {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private CaregiverType type;
    @ManyToMany
    private List<Patient> patientList;
    @OneToMany(mappedBy = "caregiver")
    private List<Visit> visitList;
}
