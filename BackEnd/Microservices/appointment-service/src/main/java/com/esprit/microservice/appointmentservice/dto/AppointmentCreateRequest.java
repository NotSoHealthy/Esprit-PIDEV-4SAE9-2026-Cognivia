package com.esprit.microservice.appointmentservice.dto;

import java.time.OffsetDateTime;

public class AppointmentCreateRequest {

    private Long caregiverId;
    private Long patientId;
    private Long doctorId;

    private OffsetDateTime appointmentDate;

    // ✅ NEW: duration for conflict detection (default handled in entity/service)
    private Integer durationMinutes;

    private String status; // "PENDING", "CONFIRMED", etc.
    private String notes;

    // Added only for mailing (Phase A)
    private String patientEmail;
    private String patientName;

    // ✅ AJOUT: HTML mail venant du frontend
    private String mailHtml;

    public Long getCaregiverId() {
        return caregiverId;
    }

    public void setCaregiverId(Long caregiverId) {
        this.caregiverId = caregiverId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public OffsetDateTime getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(OffsetDateTime appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    // ✅ NEW
    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    // ✅ NEW
    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getPatientEmail() {
        return patientEmail;
    }

    public void setPatientEmail(String patientEmail) {
        this.patientEmail = patientEmail;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getMailHtml() {
        return mailHtml;
    }

    public void setMailHtml(String mailHtml) {
        this.mailHtml = mailHtml;
    }
}