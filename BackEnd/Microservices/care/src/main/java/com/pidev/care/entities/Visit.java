package com.pidev.care.entities;

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
public class Visit {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    private VisitStatus status;
    private Instant createdAt;
    private Long visitReportId;
    @ManyToOne
    private Caregiver caregiver;
    @ManyToOne
    private Patient patient;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
