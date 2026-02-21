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
public class Caregiver {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    @Column(unique = true)
    private UUID userId;
    private String firstName;
    private String lastName;
    @Enumerated(EnumType.STRING)
    private CaregiverType type;
    @ManyToMany
    @JsonIgnore
    private List<Patient> patientList;
    @OneToMany(mappedBy = "caregiver")
    @JsonIgnore
    private List<Visit> visitList;
}
