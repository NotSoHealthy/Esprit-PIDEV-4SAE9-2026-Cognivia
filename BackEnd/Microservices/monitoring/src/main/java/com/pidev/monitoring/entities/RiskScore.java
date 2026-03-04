package com.pidev.monitoring.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskScore {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private Long patientId;
    private Double riskValue;
    private String riskLevel;

    // Trend analysis fields
    private String trendDirection; // IMPROVING, STABLE, DECLINING
    private Double averageScore; // Weighted average of last N tests
    private Integer scoreCount; // How many tests this risk is based on
    private Double previousRiskValue; // Previous risk for comparison
    private Double slopeValue; // Rate of change (Slope)
    private Boolean clinicalFlag; // Alert flag for the doctor
    private Boolean externalGameDataUsed;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime generatedAt = LocalDateTime.now();
}
