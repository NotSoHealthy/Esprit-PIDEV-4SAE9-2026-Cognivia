package com.esprit.microservice.appointmentservice.controller;

import com.esprit.microservice.appointmentservice.dto.AppointmentCreateRequest;
import com.esprit.microservice.appointmentservice.entity.Appointment;
import com.esprit.microservice.appointmentservice.entity.AppointmentStatus;
import com.esprit.microservice.appointmentservice.mail.MailService;
import com.esprit.microservice.appointmentservice.service.AppointmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public Appointment create(@RequestBody AppointmentCreateRequest req) {

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

                // ✅ if mailHtml exists -> send HTML email
                if (req.getMailHtml() != null && !req.getMailHtml().isBlank()) {
                    mailService.sendHtmlEmail(
                            req.getPatientEmail(),
                            "Confirmation de rendez-vous",
                            req.getMailHtml());
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

        return saved;
    }

    @GetMapping
    public List<Appointment> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Appointment getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public Appointment update(@PathVariable Long id, @RequestBody Appointment a) {
        return service.update(id, a);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}