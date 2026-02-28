package com.esprit.microservice.appointmentservice.repository;

import com.esprit.microservice.appointmentservice.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
}