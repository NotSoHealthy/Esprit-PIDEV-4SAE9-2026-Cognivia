package com.esprit.microservice.appointmentservice.controller;

import com.esprit.microservice.appointmentservice.mail.MailService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/appointments/mail")
public class MailTestController {

    private final MailService mailService;

    public MailTestController(MailService mailService) {
        this.mailService = mailService;
    }

    @PostMapping("/test")
    public String test(@RequestParam String to) {
        mailService.sendTestEmail(to);
        return "Email triggered (async). Check your inbox.";
    }
}