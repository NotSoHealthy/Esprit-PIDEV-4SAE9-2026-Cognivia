package com.esprit.microservice.appointmentservice.service;

import com.esprit.microservice.appointmentservice.entity.Appointment;
import com.esprit.microservice.appointmentservice.entity.AppointmentStatus;
import com.esprit.microservice.appointmentservice.exception.ConflictException;
import com.esprit.microservice.appointmentservice.repository.AppointmentRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.time.OffsetDateTime;
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

        // ✅ default duration
        if (a.getDurationMinutes() == null) {
            a.setDurationMinutes(60);
        }

        checkConflict(a, null);

        a.setMeetLink(generateMeetLink(a));

        return repo.save(a);
    }

    public List<Appointment> findAll() {
        return repo.findAll();
    }

    public List<Appointment> findByDoctorId(Long doctorId) {
        return repo.findByDoctorId(doctorId);
    }

    public Appointment updateStatus(Long id, AppointmentStatus newStatus) {
        Appointment a = findById(id);
        a.setStatus(newStatus);
        return repo.save(a);
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

        // ✅ duration update (if null => keep existing, but if existing null => default 60)
        if (updated.getDurationMinutes() != null) {
            a.setDurationMinutes(updated.getDurationMinutes());
        }
        if (a.getDurationMinutes() == null) {
            a.setDurationMinutes(60);
        }

        if (updated.getStatus() != null) {
            a.setStatus(updated.getStatus());
        }

        a.setNotes(updated.getNotes());

        checkConflict(a, id);

        return repo.save(a);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    // ===================== BUSINESS RULE =====================
    private void checkConflict(Appointment a, Long excludeId) {

        if (a.getDoctorId() == null) {
            throw new RuntimeException("doctorId is required to check appointment conflicts.");
        }
        if (a.getAppointmentDate() == null) {
            throw new RuntimeException("appointmentDate is required.");
        }
        if (a.getDurationMinutes() == null || a.getDurationMinutes() <= 0) {
            throw new RuntimeException("durationMinutes must be > 0.");
        }

        // If appointment itself is CANCELLED, we allow it (no need to block)
        if (a.getStatus() == AppointmentStatus.CANCELLED) {
            return;
        }

        OffsetDateTime start = a.getAppointmentDate();
        OffsetDateTime end = start.plusMinutes(a.getDurationMinutes());

        boolean conflict;
        if (excludeId == null) {
            conflict = repo.existsOverlap(a.getDoctorId(), start, end);
        } else {
            conflict = repo.existsOverlapExcludingId(a.getDoctorId(), excludeId, start, end);
        }

        if (conflict) {
            throw new ConflictException("Ce créneau est déjà réservé pour ce médecin.");
        }
    }

    private String generateMeetLink(Appointment appointment) {
        String token = UUID.randomUUID()
                .toString()
                .substring(0, 6);
        String roomName = "Consultation"
                + "-Dr" + appointment.getDoctorId()
                + "-Patient" + appointment.getPatientId()
                + "-" + appointment.getAppointmentDate()
                .toString()
                .replace(":", "-")
                .replace(" ", "-")
                .replace("+", "-")
                + "-" + token;
        return "https://meet.jit.si/" + roomName;
    }
}