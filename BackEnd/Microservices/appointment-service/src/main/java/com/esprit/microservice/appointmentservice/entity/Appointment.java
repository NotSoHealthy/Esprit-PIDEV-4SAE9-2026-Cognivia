package com.esprit.microservice.appointmentservice.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long caregiverId;
    private Long patientId;
    private Long doctorId;

    private OffsetDateTime appointmentDate;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    private String notes;

    // ===== GETTERS =====

    public Long getId() { return id; }

    public Long getCaregiverId() { return caregiverId; }

    public Long getPatientId() { return patientId; }

    public Long getDoctorId() { return doctorId; }

    public OffsetDateTime getAppointmentDate() { return appointmentDate; }

    public AppointmentStatus getStatus() { return status; }

    public String getNotes() { return notes; }

    // ===== SETTERS =====

    public void setId(Long id) { this.id = id; }

    public void setCaregiverId(Long caregiverId) { this.caregiverId = caregiverId; }

    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public void setAppointmentDate(OffsetDateTime appointmentDate) { this.appointmentDate = appointmentDate; }

    public void setStatus(AppointmentStatus status) { this.status = status; }

    public void setNotes(String notes) { this.notes = notes; }
}