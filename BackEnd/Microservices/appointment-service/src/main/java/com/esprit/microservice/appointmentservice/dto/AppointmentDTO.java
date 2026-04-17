package com.esprit.microservice.appointmentservice.dto;

import com.esprit.microservice.appointmentservice.entity.AppointmentStatus;
import java.time.OffsetDateTime;

public class AppointmentDTO {
    private Long id;
    private Long caregiverId;
    private Long patientId;
    private Long doctorId;
    private OffsetDateTime appointmentDate;
    private Integer durationMinutes;
    private AppointmentStatus status;
    private String notes;
    private String meetLink;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCaregiverId() { return caregiverId; }
    public void setCaregiverId(Long caregiverId) { this.caregiverId = caregiverId; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public OffsetDateTime getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(OffsetDateTime appointmentDate) { this.appointmentDate = appointmentDate; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getMeetLink() { return meetLink; }
    public void setMeetLink(String meetLink) { this.meetLink = meetLink; }
}
