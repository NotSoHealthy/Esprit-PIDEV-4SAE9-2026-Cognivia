package com.esprit.microservice.surveillanceandequipment.Entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long patientId;
    @ManyToOne
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;
    private LocalDateTime reservationDate;
    private LocalDateTime returnDate;
    @Enumerated(EnumType.STRING)
    private ReservationStatus status;
    private Long userIdAssignedBy;
    private String userRoleAssignedBy;
}
