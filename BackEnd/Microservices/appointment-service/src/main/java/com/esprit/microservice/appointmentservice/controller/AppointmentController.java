package com.esprit.microservice.appointmentservice.controller;

import com.esprit.microservice.appointmentservice.dto.AppointmentCreateRequest;
import com.esprit.microservice.appointmentservice.dto.AppointmentDTO;
import com.esprit.microservice.appointmentservice.entity.Appointment;
import com.esprit.microservice.appointmentservice.entity.AppointmentStatus;
import com.esprit.microservice.appointmentservice.mail.MailService;
import com.esprit.microservice.appointmentservice.service.AppointmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private static final Logger log = LoggerFactory.getLogger(AppointmentController.class);

    private final AppointmentService service;
    private final MailService mailService;

    // Constructor Injection (بدون Lombok)
    public AppointmentController(AppointmentService service, MailService mailService) {
        this.service = service;
        this.mailService = mailService;
    }

    @PostMapping
    public AppointmentDTO create(@RequestBody AppointmentCreateRequest req) {

        // 1) build Appointment entity (DB)
        Appointment a = new Appointment();
        a.setCaregiverId(req.getCaregiverId());
        a.setPatientId(req.getPatientId());
        a.setDoctorId(req.getDoctorId());
        a.setAppointmentDate(req.getAppointmentDate());

        // ✅ NEW: duration (if null, service/entity default is used)
        a.setDurationMinutes(req.getDurationMinutes());

        // status: if missing -> default PENDING
        if (req.getStatus() == null || req.getStatus().isBlank()) {
            a.setStatus(AppointmentStatus.PENDING);
        } else {
            a.setStatus(AppointmentStatus.valueOf(req.getStatus().toUpperCase()));
        }

        a.setNotes(req.getNotes());

        // 2) save appointment (must always succeed even if email fails)
        Appointment saved = service.create(a);

        // 3) trigger email (async) - HTML template comes from frontend (req.mailHtml)
        try {
            if (req.getPatientEmail() != null && !req.getPatientEmail().isBlank()) {

                // ✅ if mailHtml exists -> send HTML email (with meetLink placeholder replacement)
                if (req.getMailHtml() != null && !req.getMailHtml().isBlank()) {
                    mailService.sendHtmlEmail(
                            req.getPatientEmail(),
                            "Confirmation de rendez-vous",
                            req.getMailHtml(),
                            saved.getMeetLink()); // Pass generated link
                    log.info("HTML Email triggered to={} for appointmentId={}", req.getPatientEmail(), saved.getId());
                } else {
                    // ✅ fallback: keep old test email (in case frontend didn't send mailHtml)
                    mailService.sendTestEmail(req.getPatientEmail());
                    log.warn("mailHtml missing -> fallback test email. to={} appointmentId={}",
                            req.getPatientEmail(), saved.getId());
                }

            } else {
                log.warn("No patientEmail provided in request -> skipping email. appointmentId={}", saved.getId());
            }
        } catch (Exception e) {
            log.error("Email failed but appointment created. appointmentId={} err={}", saved.getId(), e.toString());
        }

        return mapToDTO(saved);
    }

    @GetMapping
    public List<AppointmentDTO> getAll() {
        return service.findAll().stream().map(this::mapToDTO).toList();
    }

    @GetMapping(params = "doctorId")
    public List<AppointmentDTO> listByDoctor(@RequestParam("doctorId") Long doctorId) {
        return service.findByDoctorId(doctorId).stream().map(this::mapToDTO).toList();
    }

    @GetMapping("/{id}")
    public AppointmentDTO getById(@PathVariable Long id) {
        return mapToDTO(service.findById(id));
    }

    @PutMapping("/{id}")
    public AppointmentDTO update(@PathVariable Long id, @RequestBody Appointment a) {
        return mapToDTO(service.update(id, a));
    }

    @PatchMapping("/{id}/status")
    public AppointmentDTO patchStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String raw = body.get("status");
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
        AppointmentStatus st = AppointmentStatus.valueOf(raw.trim().toUpperCase());
        return mapToDTO(service.updateStatus(id, st));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private AppointmentDTO mapToDTO(Appointment a) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setId(a.getId());
        dto.setCaregiverId(a.getCaregiverId());
        dto.setPatientId(a.getPatientId());
        dto.setDoctorId(a.getDoctorId());
        dto.setAppointmentDate(a.getAppointmentDate());
        dto.setDurationMinutes(a.getDurationMinutes());
        dto.setStatus(a.getStatus());
        dto.setNotes(a.getNotes());
        dto.setMeetLink(a.getMeetLink());
        return dto;
    }
}
