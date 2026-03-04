package com.esprit.microservice.surveillanceandequipment.Entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;

    private Long targetUserId;

    @Enumerated(EnumType.STRING)
    private UserRole targetUserRole;

    private String category;

    private String description;

    private String evidenceUrl;

    @Enumerated(EnumType.STRING)
    private ComplaintPriority priority;

    @Enumerated(EnumType.STRING)
    private ComplaintStatus status;

    private String handledByAdminId;

    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime investigatedAt;
    private LocalDateTime resolvedAt;

    private String resolutionDecision;
    private String appealMessage;
}
