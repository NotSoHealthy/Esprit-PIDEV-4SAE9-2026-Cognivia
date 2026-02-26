package com.pidev.pharmacy.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"pharmacy_id", "medication_id"}
        )
)
public class MedicationStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer quantity;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pharmacy_id", nullable = false)
    private Pharmacy pharmacy;

    @ManyToOne(optional = false)
    @JoinColumn(name = "medication_id", nullable = false)
    private Medication medication;
}