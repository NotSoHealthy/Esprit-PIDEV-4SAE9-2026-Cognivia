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
    @OneToOne
    private VisitReport visitReport;
    @ManyToOne
    private CareGiver careGiver;
    @ManyToOne
    private Patient patient;
}
