package com.esprit.microservice.appointmentservice.entity;

public enum AppointmentStatus {
    PENDING,  // Created but not validated
    APPROVED,  // Accepted by doctor
    CANCELLED,   // Cancelled by patient or doctor
    COMPLETED  // Appointment happened
}
}