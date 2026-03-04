package com.esprit.microservice.surveillanceandequipment.Entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Maintenance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;
    private LocalDateTime maintenanceTime;
    private LocalDateTime maintenanceCompletionTime;
    private String description;
    @Enumerated(EnumType.STRING)
    private MaintenanceStatus status;

}
