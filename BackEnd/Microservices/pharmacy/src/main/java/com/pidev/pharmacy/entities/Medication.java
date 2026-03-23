package com.pidev.pharmacy.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;


@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Description is required")
    @Size(min = 5, max = 1000, message = "Description must be between 5 and 1000 characters")
    private String description;
    
    @NotBlank(message = "Medication name is required")
    @Size(min = 2, max = 100, message = "Medication name must be between 2 and 100 characters")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(255)")
    private MedicationStatus medicationStatus = MedicationStatus.ACCEPTED;

    @NotNull(message = "Therapeutic class is required")
    @Enumerated(EnumType.STRING)
    private TherapeuticClass therapeuticClass;
    
    @Column(columnDefinition = "TEXT")
    private String imageUrl;
}