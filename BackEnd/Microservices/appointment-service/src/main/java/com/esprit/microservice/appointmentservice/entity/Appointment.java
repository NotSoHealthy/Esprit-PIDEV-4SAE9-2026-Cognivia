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

    @Column(name = "appointment_date")
    private OffsetDateTime appointmentDate;

    // ✅ NEW: duration (minutes). Default 60.
    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    private String notes;

    // ===== GETTERS =====

    public Long getId() {
        return id;
    }

    public Long getCaregiverId() {
        return caregiverId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public OffsetDateTime getAppointmentDate() {
        return appointmentDate;
    }

    // ✅ NEW
    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    // ===== SETTERS =====

    public void setId(Long id) {
        this.id = id;
    }

    public void setCaregiverId(Long caregiverId) {
        this.caregiverId = caregiverId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public void setAppointmentDate(OffsetDateTime appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    // ✅ NEW
    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}