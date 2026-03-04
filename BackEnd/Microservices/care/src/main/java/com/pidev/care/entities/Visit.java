package com.pidev.care.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Visit {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    @Enumerated(EnumType.STRING)
    private VisitStatus status;
    private LocalDate date;
    private Instant createdAt;
    @ManyToOne
    private Caregiver caregiver;
    @ManyToOne
    private Patient patient;
    @ManyToOne
    private Doctor doctor;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = VisitStatus.SCHEDULED;
        }
    }

}
