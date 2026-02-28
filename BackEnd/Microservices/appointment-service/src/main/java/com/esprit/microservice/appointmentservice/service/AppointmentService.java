package com.esprit.microservice.appointmentservice.service;

import com.esprit.microservice.appointmentservice.entity.Appointment;
import com.esprit.microservice.appointmentservice.entity.AppointmentStatus;
import com.esprit.microservice.appointmentservice.repository.AppointmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository repo;

    // Constructor Injection يدوي
    public AppointmentService(AppointmentRepository repo) {
        this.repo = repo;
    }

    public Appointment create(Appointment a) {
        if (a.getStatus() == null) {
            a.setStatus(AppointmentStatus.PENDING);
        }
        return repo.save(a);
    }

    public List<Appointment> findAll() {
        return repo.findAll();
    }

    public Appointment findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
    }

    public Appointment update(Long id, Appointment updated) {
        Appointment a = findById(id);

        a.setCaregiverId(updated.getCaregiverId());
        a.setPatientId(updated.getPatientId());
        a.setDoctorId(updated.getDoctorId());
        a.setAppointmentDate(updated.getAppointmentDate());

        if (updated.getStatus() != null) {
            a.setStatus(updated.getStatus());
        }

        a.setNotes(updated.getNotes());

        return repo.save(a);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}